const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { createVnpayPaymentUrl, vnpayConfig, sortObject } = require('../config/vnpay');
const querystring = require('querystring');
const crypto = require('crypto');

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

/**
 * @desc    Tạo URL thanh toán VNPAY
 * @route   POST /api/payments/vnpay/create-payment-url
 * @access  Private
 */
const createVnpayPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

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

  try {
    // Lấy IP của client
    const ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    // Đảm bảo amount là số nguyên dương
    const amount = Math.round(order.totalPrice);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Số tiền không hợp lệ');
    }

    // Tạo URL thanh toán VNPAY
    const vnpayUrl = createVnpayPaymentUrl(orderId, amount, ipAddr);

    // Cập nhật trạng thái đơn hàng
    order.paymentMethod = 'vnpay';
    order.paymentStatus = 'pending';
    await order.save();

    // Log URL để debug
    console.log('VNPAY URL:', vnpayUrl);

    res.json({ vnpayUrl });
  } catch (error) {
    console.error('VNPAY URL creation error:', error);
    res.status(400);
    throw new Error('Không thể tạo URL thanh toán VNPAY: ' + error.message);
  }
});

/**
 * @desc    Xử lý kết quả thanh toán VNPAY
 * @route   GET /api/payments/vnpay/return
 * @access  Public
 */
const handleVnpayReturn = asyncHandler(async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    console.log('Received VNPAY params:', vnp_Params);

    // Xóa các tham số không cần thiết
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Xóa các tham số rỗng và decode các giá trị
    const decodedParams = {};
    Object.keys(vnp_Params).forEach(key => {
      if (vnp_Params[key] !== null && vnp_Params[key] !== undefined && vnp_Params[key] !== '') {
        decodedParams[key] = decodeURIComponent(vnp_Params[key].replace(/\+/g, ' '));
      }
    });

    // Sắp xếp các tham số
    const sortedParams = sortObject(decodedParams);

    // Tạo chuỗi ký tự cần kiểm tra
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    // Tạo chữ ký để so sánh
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

    console.log('Received hash:', secureHash);
    console.log('Generated hash:', signed);
    console.log('Raw sign data:', signData);

    if (secureHash === signed) {
      // Lấy orderId từ vnp_OrderInfo (format: "ORDER:orderId")
      const orderInfo = decodedParams['vnp_OrderInfo'];
      console.log('Received order info:', orderInfo);

      const orderId = orderInfo.split(':')[1];
      console.log('Extracted orderId:', orderId);

      const rspCode = decodedParams['vnp_ResponseCode'];
      console.log('Response code:', rspCode);

      // Tìm đơn hàng
      const order = await Order.findById(orderId);
      console.log('Found order:', order ? 'Yes' : 'No');

      if (!order) {
        console.error('Order not found:', orderId);
        return res.redirect(`${process.env.FRONTEND_URL}/order-failed?error=order_not_found`);
      }

      // Cập nhật trạng thái đơn hàng
      if (rspCode === '00') {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'completed';
        order.paymentResult = {
          id: decodedParams['vnp_TransactionNo'],
          status: 'completed',
          update_time: Date.now(),
        };
        await order.save();

        // Tạo bản ghi thanh toán
        await Payment.create({
          order: orderId,
          user: order.user,
          paymentMethod: 'vnpay',
          amount: parseInt(decodedParams['vnp_Amount']) / 100,
          currency: 'VND',
          status: 'completed',
          transactionId: decodedParams['vnp_TransactionNo'],
          paymentDetails: {
            bankCode: decodedParams['vnp_BankCode'],
            bankTranNo: decodedParams['vnp_BankTranNo'],
            cardType: decodedParams['vnp_CardType'],
            payDate: decodedParams['vnp_PayDate'],
          },
        });

        console.log('Payment successful, redirecting to:', `${process.env.FRONTEND_URL}/order-success?orderId=${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL}/order-success?orderId=${orderId}`);
      } else {
        order.paymentStatus = 'failed';
        await order.save();
        console.log('Payment failed, redirecting to:', `${process.env.FRONTEND_URL}/order-failed?orderId=${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL}/order-failed?orderId=${orderId}`);
      }
    } else {
      console.error('Invalid signature:', {
        receivedHash: secureHash,
        calculatedHash: signed,
        signData: signData
      });
      return res.redirect(`${process.env.FRONTEND_URL}/order-failed?error=invalid_signature`);
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/order-failed?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = {
  createPayment,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
  createVnpayPayment,
  handleVnpayReturn,
};