const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Create new order
router.post('/createOrder', orderController.createOrder.bind(orderController));

// Get order by ID
router.get('/:orderId', orderController.getOrder.bind(orderController));

// Get all orders
router.get('/', orderController.getAllOrders.bind(orderController));

module.exports = router;