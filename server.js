const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./database');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required but missing');
  console.error('Please add OPENAI_API_KEY to your .env file');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import route modules
const sessionRoutes = require('./routes/session');
const toolsRoutes = require('./routes/tools');
const ordersRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Register API routes
app.use('/api/session', sessionRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Initializing database...');
    await db.initDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log('');
      console.log('☕ Brew & Byte Café Server');
      console.log('==========================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
      console.log('');
      console.log('🌐 Web interfaces:');
      console.log(`  📱 Main app: http://localhost:${PORT}`);
      console.log(`  🎛️  Admin dashboard: http://localhost:${PORT}/admin.html`);
      console.log(`  📊 Deck view: http://localhost:${PORT}/deck.html`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /api/session       - Create WebRTC session');
      console.log('  GET  /api/tools/menu    - Fetch menu');
      console.log('  POST /api/tools/user    - Find/create user');
      console.log('  POST /api/tools/confirm - Confirm order');
      console.log('  POST /api/tools/order   - Submit order');
      console.log('  GET  /api/tools/history - Get order history');
      console.log('  POST /api/tools/suggestions - Get suggestions');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();