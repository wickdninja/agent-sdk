const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/analytics/sales - Get today's sales summary
router.get('/sales', async (req, res) => {
  try {
    const sales = await db.getTodaySales();
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// GET /api/analytics/weekly - Get weekly sales data
router.get('/weekly', async (req, res) => {
  try {
    const weeklyData = await db.getWeeklySales();
    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
});

// GET /api/analytics/popular - Get popular items
router.get('/popular', async (req, res) => {
  try {
    const popularItems = await db.getPopularItems();
    res.json(popularItems);
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ error: 'Failed to fetch popular items' });
  }
});

// GET /api/analytics/revenue - Get revenue breakdown
router.get('/revenue', async (req, res) => {
  try {
    const revenue = await db.getRevenueByCategory();
    res.json(revenue);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

module.exports = router;