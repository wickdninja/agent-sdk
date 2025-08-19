const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/orders/active - Get all active orders
router.get('/active', async (req, res) => {
  try {
    const orders = await db.getActiveOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const success = await db.updateOrderStatus(id, status);
    if (success) {
      res.json({ success: true, message: 'Order status updated' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;