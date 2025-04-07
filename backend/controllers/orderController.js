const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * @desc    Tạo đơn hàng mới
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('Không có sản phẩm nào trong đơn hàng');
  } else {
    // Kiểm tra số lượng sản phẩm trong kho
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Không tìm thấy sản phẩm: ${item.name}`);
      }
      if (product.countInStock < item.quantity) {
        res.status(400);
        throw new Error(`Sản phẩm ${product.name} chỉ còn ${product.countInStock} trong kho`);
      }
    }

    // Tạo đơn hàng mới
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // Lưu đơn hàng và cập nhật số lượng sản phẩm trong kho
    const createdOrder = await order.save();
    
    // Giảm số lượng sản phẩm trong kho
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.countInStock -= item.quantity;
      await product.save();
    }

    res.status(201).json(createdOrder);
  }
});

/**
 * @desc    Lấy đơn hàng theo ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email'
  );

  if (order) {
    // Kiểm tra quyền truy cập (chỉ admin hoặc chủ đơn hàng mới được xem)
    if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
});

/**
 * @desc    Cập nhật trạng thái đơn hàng thành đã thanh toán
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
});

/**
 * @desc    Cập nhật trạng thái đơn hàng thành đã giao hàng
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
});

/**
 * @desc    Lấy tất cả đơn hàng của người dùng đang đăng nhập
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

/**
 * @desc    Lấy tất cả đơn hàng
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id firstName lastName');
  res.json(orders);
});

/**
 * @desc    Hủy đơn hàng
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  // Kiểm tra quyền hủy đơn hàng
  if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bạn không có quyền hủy đơn hàng này');
  }

  // Chỉ cho phép hủy đơn hàng chưa thanh toán và chưa giao hàng
  if (order.isPaid || order.isDelivered) {
    res.status(400);
    throw new Error('Không thể hủy đơn hàng đã thanh toán hoặc đã giao hàng');
  }

  // Hoàn trả số lượng sản phẩm vào kho
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock += item.quantity;
      await product.save();
    }
  }

  // Xóa đơn hàng
  await order.remove();

  res.json({ message: 'Đơn hàng đã được hủy' });
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
};