const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controllers
// Các controller này sẽ được tạo sau
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

// Route: /api/cart
router.route('/')
  .get(protect, getCart) // Lấy giỏ hàng của người dùng hiện tại
  .post(protect, addToCart) // Thêm sản phẩm vào giỏ hàng
  .delete(protect, clearCart); // Xóa toàn bộ giỏ hàng

// Route: /api/cart/:itemId
router.route('/:itemId')
  .put(protect, updateCartItem) // Cập nhật số lượng sản phẩm trong giỏ hàng
  .delete(protect, removeFromCart); // Xóa một sản phẩm khỏi giỏ hàng

module.exports = router;