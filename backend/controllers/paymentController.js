const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

/**
 * @desc    Tạo thanh toán mới
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    paymentMethod,
    amount,
    currency,
    paymentDetails,
  } = req.body;

  // Kiểm tra xem đơn hàng có tồn tại không
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  // Kiểm tra xem người dùng có quyền thanh toán đơn hàng này không
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Không có quyền thanh toán đơn hàng này');
  }

  // Tạo thanh toán mới
  const payment = await Payment.create({
    order: orderId,
    user: req.user._id,
    paymentMethod,
    amount,
    currency: currency || 'VND',
    status: 'pending',
    paymentDetails: paymentDetails || {},
  });

  if (payment) {
    res.status(201).json(payment);
  } else {
    res.status(400);
    throw new Error('Dữ liệu thanh toán không hợp lệ');
  }
});

/**
 * @desc    Lấy thông tin chi tiết của thanh toán
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order')
    .populate('user', 'name email');

  if (payment) {
    // Kiểm tra quyền truy cập (chỉ admin hoặc chủ sở hữu mới có thể xem)
    if (
      payment.user._id.toString() === req.user._id.toString() ||
      req.user.isAdmin
    ) {
      res.json(payment);
    } else {
      res.status(401);
      throw new Error('Không có quyền truy cập thông tin thanh toán này');
    }
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thanh toán');
  }
});

/**
 * @desc    Lấy tất cả thanh toán của người dùng hiện tại
 * @route   GET /api/payments/my
 * @access  Private
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('order')
    .sort({ createdAt: -1 });

  res.json(payments);
});

/**
 * @desc    Lấy tất cả thanh toán (chỉ admin)
 * @route   GET /api/payments
 * @access  Private/Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
  // Phân trang
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Payment.countDocuments({});
  const payments = await Payment.find({})
    .populate('user', 'id name email')
    .populate('order')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    payments,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Cập nhật trạng thái thanh toán
 * @route   PUT /api/payments/:id
 * @access  Private/Admin
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, transactionId } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (payment) {
    payment.status = status || payment.status;
    if (transactionId) {
      payment.transactionId = transactionId;
    }

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thanh toán');
  }
});

module.exports = {
  createPayment,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
};