const express = require('express');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Order routes
router.use('/order', orderRoutes);

module.exports = router;