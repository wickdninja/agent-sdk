const express = require('express');
const router = express.Router();
const { menu } = require('../menu');
const db = require('../database');
const { generateSuggestions } = require('../services/suggestions');
const sessionManager = require('../services/session-manager');

// Helper function to find menu item by ID
function findMenuItem(itemId) {
  // Search in drinks
  for (const category of Object.values(menu.drinks || {})) {
    if (Array.isArray(category)) {
      const item = category.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  
  // Search in food
  for (const category of Object.values(menu.food || {})) {
    if (Array.isArray(category)) {
      const item = category.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  
  return null;
}

// Helper function to find customization by ID
function findCustomization(custId) {
  if (menu.customizations) {
    // Search through all customization categories
    for (const category of Object.values(menu.customizations)) {
      if (Array.isArray(category)) {
        const customization = category.find(c => c.id === custId);
        if (customization) return customization;
      }
    }
  }
  return null;
}

// GET /api/tools/menu - Fetch the menu
router.get('/menu', (req, res) => {
  console.log('Menu requested');
  res.json(menu);
});

// POST /api/tools/user - Find or create user
router.post('/user', async (req, res) => {
  const { name, sessionId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  console.log(`Finding or creating user: ${name}`);

  try {
    // First, try to find existing user by name
    let user = await db.findUserByName(name);
    
    if (user) {
      console.log(`Found existing user: ${user.id} (${user.name})`);
    } else {
      // Create new user with a stable ID based on normalized name
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userId = `user_${normalizedName}`;
      
      user = await db.createUser(userId, name);
      console.log(`Created new user: ${userId} (${name})`);
    }

    // Get order history for this user
    const orderHistory = await db.getUserOrderHistory(user.id, 100);
    const orderCount = orderHistory.length;
    
    // Determine user type based on order count
    let userType = 'new';
    if (orderCount >= 10) {
      userType = 'vip';
    } else if (orderCount >= 5) {
      userType = 'regular';
    } else if (orderCount >= 1) {
      userType = 'returning';
    }

    // Update session with user info if sessionId provided
    if (sessionId) {
      await sessionManager.setUserInfo(sessionId, user.id, {
        name: user.name,
        userType,
        orderCount
      });
    }

    res.json({
      userId: user.id,
      name: user.name,
      userType,
      isReturning: orderCount > 0,
      orderCount,
      greeting: orderCount > 0 
        ? `Welcome back, ${user.name}! Great to see you again. You've been here ${orderCount} time${orderCount > 1 ? 's' : ''}.`
        : `Nice to meet you, ${user.name}! Welcome to Brew & Byte Café.`
    });
  } catch (error) {
    console.error('Error finding/creating user:', error);
    res.status(500).json({ error: 'Failed to process user' });
  }
});

// POST /api/tools/confirm - Confirm order details and calculate total
router.post('/confirm', (req, res) => {
  const { items, userId } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  console.log(`Confirming order for user ${userId}:`, items);

  try {
    const orderDetails = [];
    let total = 0;

    items.forEach(item => {
      const menuItem = findMenuItem(item.itemId);
      if (!menuItem) {
        console.warn(`Menu item not found: ${item.itemId}`);
        return;
      }

      const quantity = item.quantity || 1;
      let itemTotal = menuItem.price * quantity;
      let itemDescription = `${quantity}x ${menuItem.name}`;
      const customizations = [];

      // Handle customizations
      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(custId => {
          const customization = findCustomization(custId);
          if (customization) {
            itemTotal += customization.price * quantity;
            customizations.push(customization.name);
          }
        });
      }

      if (customizations.length > 0) {
        itemDescription += ` (${customizations.join(', ')})`;
      }

      orderDetails.push({
        name: menuItem.name,
        description: itemDescription,
        quantity,
        customizations,
        price: itemTotal
      });

      total += itemTotal;
    });

    // Calculate tax and final total
    const tax = total * 0.07; // 7% Indiana sales tax
    const finalTotal = total + tax;

    res.json({
      items: orderDetails,
      subtotal: total.toFixed(2),
      tax: tax.toFixed(2),
      total: finalTotal.toFixed(2),
      message: `Your order total is $${finalTotal.toFixed(2)}. Would you like to confirm this order?`
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// POST /api/tools/order - Submit final order
router.post('/order', async (req, res) => {
  const { items, userId, total } = req.body;

  if (!items || !userId) {
    return res.status(400).json({ error: 'Items and userId are required' });
  }

  console.log(`Submitting order for user ${userId}`);

  try {
    // Calculate total if not provided and prepare items for database
    let orderTotal = total;
    const dbItems = [];
    
    items.forEach(item => {
      const menuItem = findMenuItem(item.itemId);
      if (menuItem) {
        const quantity = item.quantity || 1;
        let itemPrice = menuItem.price * quantity;
        const customizationNames = [];
        
        // Add customization costs
        if (item.customizations && item.customizations.length > 0) {
          item.customizations.forEach(custId => {
            const customization = findCustomization(custId);
            if (customization) {
              itemPrice += customization.price * quantity;
              customizationNames.push(customization.name);
            }
          });
        }
        
        // Prepare item for database
        dbItems.push({
          itemId: item.itemId,
          name: menuItem.name,
          category: 'coffee',
          price: itemPrice,
          quantity: quantity,
          customizations: customizationNames
        });
        
        if (!orderTotal) {
          orderTotal = (orderTotal || 0) + itemPrice;
        }
      }
    });
    
    // Add tax if total wasn't provided
    if (!total) {
      orderTotal = orderTotal * 1.07; // 7% Indiana sales tax
    }
    
    // Create order in database (createOrder expects userId, items, total)
    const orderIdNum = await db.createOrder(userId, dbItems, parseFloat(orderTotal));
    const orderId = orderIdNum.toString();
    
    // Calculate estimated time (3-7 minutes based on items)
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const baseTime = 3;
    const additionalTime = Math.min(itemCount * 0.5, 4);
    const estimatedMinutes = Math.ceil(baseTime + additionalTime);

    res.json({
      orderId,
      status: 'confirmed',
      estimatedTime: `${estimatedMinutes} minutes`,
      message: `Perfect! Your order #${orderId} has been placed and will be ready in about ${estimatedMinutes} minutes. We'll call your name when it's ready!`
    });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// GET /api/tools/history - Get user's order history
router.get('/history', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  console.log(`Fetching order history for user ${userId}`);

  try {
    const orders = await db.getUserOrderHistory(userId, 50);
    
    // Format orders for the response
    const formattedOrders = orders.map(order => ({
      orderId: order.id,
      date: order.created_at,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      total: order.total,
      status: order.status
    }));

    res.json({
      userId,
      orderCount: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// POST /api/tools/suggestions - Get smart suggestions based on context
router.post('/suggestions', async (req, res) => {
  const { userId, sessionId, currentItem, conversationContext } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const suggestions = await generateSuggestions(userId, sessionId, currentItem, conversationContext);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

module.exports = router;