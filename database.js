const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'cafe.db'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      size TEXT,
      temperature TEXT,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      customizations TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      context TEXT DEFAULT '{}',
      user_info TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
  `);

  console.log('Database initialized successfully');
  return db;
}

// User operations
async function createUser(id, name, phone = null, preferences = null) {
  const stmt = await db.prepare(
    'INSERT OR REPLACE INTO users (id, name, phone, preferences, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
  );
  await stmt.run(id, name, phone, preferences ? JSON.stringify(preferences) : null);
  return { id, name, phone, preferences };
}

async function getUser(id) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', id);
  if (user && user.preferences) {
    user.preferences = JSON.parse(user.preferences);
  }
  return user;
}

async function findUserByName(name) {
  // Try exact match first (case-insensitive)
  let user = await db.get(
    'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
    name
  );
  
  // If no exact match, try partial match
  if (!user) {
    user = await db.get(
      'SELECT * FROM users WHERE LOWER(name) LIKE LOWER(?)',
      `%${name}%`
    );
  }
  
  if (user && user.preferences) {
    user.preferences = JSON.parse(user.preferences);
  }
  
  return user;
}

// Order operations
async function createOrder(userId, items, total) {
  const result = await db.run(
    'INSERT INTO orders (user_id, items, total, status) VALUES (?, ?, ?, ?)',
    userId, JSON.stringify(items), total, 'preparing'
  );
  
  const orderId = result.lastID;
  
  // Insert individual items for analytics
  for (const item of items) {
    await db.run(
      `INSERT INTO order_items (order_id, item_name, category, subcategory, size, temperature, price, quantity, customizations) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orderId,
      item.name,
      item.category || 'coffee',
      item.subcategory || '',
      item.size || 'medium',
      item.temperature || 'hot',
      item.price,
      item.quantity || 1,
      item.customizations ? JSON.stringify(item.customizations) : null
    );
  }
  
  return orderId;
}

async function getOrder(orderId) {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', orderId);
  if (order && order.items) {
    order.items = JSON.parse(order.items);
  }
  return order;
}

async function updateOrderStatus(orderId, status) {
  await db.run(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    status, orderId
  );
  return { success: true };
}

async function getActiveOrders() {
  const orders = await db.all(
    `SELECT o.*, u.name as customer_name 
     FROM orders o 
     JOIN users u ON o.user_id = u.id 
     WHERE o.status IN ('pending', 'preparing', 'ready') 
     ORDER BY o.created_at DESC`
  );
  
  return orders.map(order => ({
    ...order,
    items: JSON.parse(order.items)
  }));
}

async function getUserOrderHistory(userId, limit = 10) {
  const orders = await db.all(
    `SELECT * FROM orders 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    userId, limit
  );
  
  return orders.map(order => ({
    ...order,
    items: JSON.parse(order.items)
  }));
}

// Analytics operations
async function getTodaySales() {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = await db.get(
    `SELECT 
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(AVG(total), 0) as average_order_value
     FROM orders 
     WHERE DATE(created_at) = DATE(?)`,
    today
  );
  
  return stats;
}

async function getWeeklySales() {
  const sales = await db.all(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as total_sales
     FROM orders 
     WHERE DATE(created_at) >= DATE('now', '-7 days')
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );
  
  // Fill in missing days with zero sales
  const salesMap = new Map(sales.map(s => [s.date, s]));
  const result = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (salesMap.has(dateStr)) {
      result.push({
        date: dateStr,
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        ...salesMap.get(dateStr)
      });
    } else {
      result.push({
        date: dateStr,
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        order_count: 0,
        total_sales: 0
      });
    }
  }
  
  return result;
}

async function getPopularItems(limit = 10) {
  const items = await db.all(
    `SELECT 
      item_name as name,
      category,
      subcategory,
      AVG(price) as price,
      COUNT(*) as times_ordered,
      SUM(quantity) as total_quantity
     FROM order_items 
     GROUP BY item_name, category, subcategory
     ORDER BY times_ordered DESC
     LIMIT ?`,
    limit
  );
  
  return items;
}

async function getRevenueByCategory() {
  const revenue = await db.all(
    `SELECT 
      category,
      SUM(price * quantity) as revenue,
      COUNT(*) as items_sold
     FROM order_items 
     GROUP BY category
     ORDER BY revenue DESC`
  );
  
  return revenue;
}

async function getSuggestions(userId, currentContext = {}) {
  const suggestions = [];
  
  // Get user's order history if they exist
  if (userId) {
    const user = await getUser(userId);
    
    if (user) {
      // Get their favorite items
      const favorites = await db.all(
        `SELECT 
          item_name as name,
          category,
          subcategory,
          size,
          temperature,
          COUNT(*) as order_count
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ?
         GROUP BY item_name, size, temperature
         ORDER BY order_count DESC
         LIMIT 3`,
        userId
      );
      
      if (favorites.length > 0) {
        suggestions.push({
          type: 'favorites',
          title: 'Your Favorites',
          items: favorites.map(f => ({
            text: `${f.name} (${f.size}, ${f.temperature})`,
            action: 'order_favorite',
            data: f
          }))
        });
      }
    }
  }
  
  // Context-based suggestions
  if (currentContext.lastItem) {
    const item = currentContext.lastItem;
    const variations = [];
    
    // Temperature variations
    if (item.temperature === 'hot') {
      variations.push({
        text: `Make it iced`,
        action: 'modify_temperature',
        data: { temperature: 'iced' }
      });
    } else if (item.temperature === 'iced') {
      variations.push({
        text: `Make it hot`,
        action: 'modify_temperature',
        data: { temperature: 'hot' }
      });
    }
    
    // Size variations
    if (item.size !== 'large') {
      variations.push({
        text: `Upgrade to large`,
        action: 'modify_size',
        data: { size: 'large' }
      });
    }
    
    // Common customizations
    if (item.category === 'coffee') {
      variations.push({
        text: `Add extra shot`,
        action: 'add_customization',
        data: { customization: 'extra_shot' }
      });
      variations.push({
        text: `With oat milk`,
        action: 'add_customization',
        data: { customization: 'oat_milk' }
      });
    }
    
    if (variations.length > 0) {
      suggestions.push({
        type: 'variations',
        title: 'Customize Your Order',
        items: variations
      });
    }
  }
  
  // Popular items right now
  const popularToday = await db.all(
    `SELECT 
      item_name as name,
      category,
      COUNT(*) as orders_today
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE DATE(o.created_at) = DATE('now')
     GROUP BY item_name
     ORDER BY orders_today DESC
     LIMIT 3`
  );
  
  if (popularToday.length > 0) {
    suggestions.push({
      type: 'trending',
      title: 'Popular Today',
      items: popularToday.map(p => ({
        text: p.name,
        action: 'order_popular',
        data: p
      }))
    });
  }
  
  // Default suggestions if nothing specific
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'quick_actions',
      title: 'Quick Actions',
      items: [
        { text: 'View menu', action: 'view_menu' },
        { text: 'Surprise me!', action: 'random_suggestion' },
        { text: 'What\'s new?', action: 'whats_new' }
      ]
    });
  }
  
  return suggestions;
}

// Session management functions
async function getSession(sessionId) {
  const session = await db.get(
    'SELECT * FROM sessions WHERE id = ?',
    [sessionId]
  );
  
  if (session) {
    // Parse JSON fields
    session.context = JSON.parse(session.context || '{}');
    session.user_info = JSON.parse(session.user_info || '{}');
  }
  
  return session;
}

async function createSession(sessionId, userId = null) {
  await db.run(
    `INSERT INTO sessions (id, user_id, context, user_info)
     VALUES (?, ?, '{}', '{}')`,
    [sessionId, userId]
  );
  
  return getSession(sessionId);
}

async function updateSession(sessionId, updates) {
  const { context, userInfo, userId } = updates;
  const params = [];
  const setClauses = ['last_activity = CURRENT_TIMESTAMP'];
  
  if (context !== undefined) {
    setClauses.push('context = ?');
    params.push(JSON.stringify(context));
  }
  
  if (userInfo !== undefined) {
    setClauses.push('user_info = ?');
    params.push(JSON.stringify(userInfo));
  }
  
  if (userId !== undefined) {
    setClauses.push('user_id = ?');
    params.push(userId);
  }
  
  params.push(sessionId);
  
  await db.run(
    `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
  
  return getSession(sessionId);
}

async function deleteSession(sessionId) {
  const result = await db.run(
    'DELETE FROM sessions WHERE id = ?',
    [sessionId]
  );
  
  return result.changes > 0;
}

async function cleanupOldSessions(maxAgeMinutes = 30) {
  const result = await db.run(
    `DELETE FROM sessions 
     WHERE datetime(last_activity) < datetime('now', '-' || ? || ' minutes')`,
    [maxAgeMinutes]
  );
  
  return result.changes;
}

async function getActiveSessions(minutes = 15) {
  const sessions = await db.all(
    `SELECT id, user_id, last_activity,
            CAST((julianday('now') - julianday(last_activity)) * 24 * 60 AS INTEGER) as inactive_minutes
     FROM sessions 
     WHERE datetime(last_activity) >= datetime('now', '-' || ? || ' minutes')
     ORDER BY last_activity DESC`,
    [minutes]
  );
  
  return sessions;
}

async function getSessionByUserId(userId) {
  const session = await db.get(
    `SELECT * FROM sessions 
     WHERE user_id = ? 
     ORDER BY last_activity DESC 
     LIMIT 1`,
    [userId]
  );
  
  if (session) {
    session.context = JSON.parse(session.context || '{}');
    session.user_info = JSON.parse(session.user_info || '{}');
  }
  
  return session;
}

module.exports = {
  initDatabase,
  createUser,
  getUser,
  findUserByName,
  createOrder,
  getOrder,
  updateOrderStatus,
  getActiveOrders,
  getUserOrderHistory,
  getTodaySales,
  getWeeklySales,
  getPopularItems,
  getRevenueByCategory,
  getSuggestions,
  // Session functions
  getSession,
  createSession,
  updateSession,
  deleteSession,
  cleanupOldSessions,
  getActiveSessions,
  getSessionByUserId
};