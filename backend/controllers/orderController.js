const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const OrderHistory = require("../models/OrderHistory");

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

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("Không có sản phẩm nào trong đơn hàng");
  }

  // Kiểm tra và xác thực từng sản phẩm
  const validatedItems = [];
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Không tìm thấy sản phẩm với ID: ${item.product}`);
    }

    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(
        `Sản phẩm ${product.name} chỉ còn ${product.countInStock} trong kho`
      );
    }

    validatedItems.push({
      ...item,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  // Tạo đơn hàng mới với thông tin sản phẩm đã xác thực
  const order = new Order({
    orderItems: validatedItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
    status: "pending",
  });

  try {
    // Lưu đơn hàng
    const createdOrder = await order.save();

    // Lưu lịch sử đơn hàng
    const orderHistory = new OrderHistory({
      user: req.user._id,
      order: createdOrder._id,
      status: createdOrder.status,
    });
    await orderHistory.save();

    console.log("Creating order history for order ID:", createdOrder._id);

    // Cập nhật số lượng trong kho
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    }

    // Xóa giỏ hàng sau khi đặt hàng thành công
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500);
    throw new Error("Lỗi khi tạo đơn hàng: " + error.message);
  }
});

/**
 * @desc    Lấy đơn hàng theo ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "firstName lastName email"
  );

  if (order) {
    // Kiểm tra quyền truy cập (chỉ admin hoặc chủ đơn hàng mới được xem)
    if (
      !req.user.isAdmin &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("Bạn không có quyền xem đơn hàng này");
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
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
    throw new Error("Không tìm thấy đơn hàng");
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
    throw new Error("Không tìm thấy đơn hàng");
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
  const orders = await Order.find({}).populate("user", "id firstName lastName");
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
    throw new Error("Không tìm thấy đơn hàng");
  }

  // Kiểm tra quyền hủy đơn hàng
  if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền hủy đơn hàng này");
  }

  // Chỉ cho phép hủy đơn hàng chưa thanh toán và chưa giao hàng
  if (order.isPaid || order.isDelivered) {
    res.status(400);
    throw new Error("Không thể hủy đơn hàng đã thanh toán hoặc đã giao hàng");
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

  res.json({ message: "Đơn hàng đã được hủy" });
});

/**
 * @desc    Cập nhật trạng thái đơn hàng
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }

  // Kiểm tra quyền cập nhật (chỉ admin mới được cập nhật)
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Bạn không có quyền cập nhật trạng thái đơn hàng");
  }

  const { status } = req.body;

  // Kiểm tra trạng thái hợp lệ
  const validStatuses = ["pending", "processing", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Trạng thái không hợp lệ");
  }

  // Cập nhật trạng thái
  order.status = status;

  // Nếu trạng thái là completed, tự động cập nhật isDelivered
  if (status === "completed") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  // Nếu trạng thái là cancelled, hoàn trả số lượng sản phẩm vào kho
  if (status === "cancelled" && !order.isCancelled) {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.quantity;
        await product.save();
      }
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

/**
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @route   DELETE /api/carts/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    const cartItem = cart.items.id(itemId);

    if (!cartItem) {
      res.status(404);
      throw new Error("Item not found in cart");
    }

    console.log("Attempting to remove item:", itemId);
    console.log("Cart before removal:", cart);

    // Use pull to remove the item
    cart.items.pull(itemId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price image countInStock"
    );

    res.json(updatedCart);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @desc    Lấy lịch sử đơn hàng của người dùng
 * @route   GET /api/orders/history
 * @access  Private
 */
const getOrderHistory = asyncHandler(async (req, res) => {
  try {
    console.log("Getting order history for user:", req.user._id);

    // Trước tiên, tìm tất cả lịch sử đơn hàng của người dùng
    const orderHistories = await OrderHistory.find({
      user: req.user._id,
    });

    // Sau đó, tìm các đơn hàng tương ứng và populate thông tin sản phẩm
    const populatedOrderHistories = await Promise.all(
      orderHistories.map(async (history) => {
        const order = await Order.findById(history.order).populate({
          path: "orderItems.product",
          model: "Product",
          select: "name image price description countInStock",
        });

        // Trả về lịch sử đơn hàng với đơn hàng đã được populate
        return {
          ...history.toObject(),
          order: order,
        };
      })
    );

    console.log(
      "Order history retrieved successfully:",
      populatedOrderHistories.length,
      "records"
    );
    res.json(populatedOrderHistories);
  } catch (error) {
    console.error("Error retrieving order history:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy lịch sử đặt hàng: " + error.message });
  }
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
  updateOrderStatus,
  removeFromCart,
  getOrderHistory,
};
