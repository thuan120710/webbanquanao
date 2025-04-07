const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: /api/orders
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Route: /api/orders/myorders
router.route('/myorders').get(protect, getMyOrders);

// Route: /api/orders/:id
router.route('/:id').get(protect, getOrderById);

// Route: /api/orders/:id/pay
router.route('/:id/pay').put(protect, updateOrderToPaid);

// Route: /api/orders/:id/deliver
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

// Route: /api/orders/:id/cancel
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;