const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Lấy giỏ hàng của người dùng hiện tại
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name price image countInStock"
  );

  if (cart) {
    res.json(cart);
  } else {
    // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
    const newCart = await Cart.create({
      user: req.user._id,
      items: [],
    });
    res.json(newCart);
  }
});

/**
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @route   POST /api/cart
 * @access  Private
 */
// Thêm sản phẩm vào giỏ hàng
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Kiểm tra sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại");
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error("Sản phẩm không đủ số lượng");
  }

  // Tìm giỏ hàng của người dùng
  let cart = await Cart.findOne({ user: req.user._id });

  // Nếu giỏ hàng chưa có, tạo mới giỏ hàng
  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      items: [{ product: productId, quantity }],
    });
  } else {
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existItem) {
      // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
      existItem.quantity += quantity;
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm vào
      cart.items.push({ product: productId, quantity });
    }
  }

  // Lưu giỏ hàng vào database
  await cart.save();

  // Trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findById(cart._id).populate(
    "items.product",
    "name price image countInStock"
  );
  res.status(201).json(updatedCart);
});

/**
 * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const itemId = req.params.itemId;

  // Tìm giỏ hàng của người dùng
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Không tìm thấy giỏ hàng");
  }

  // Tìm sản phẩm trong giỏ hàng
  const cartItem = cart.items.id(itemId);

  if (!cartItem) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
  }

  // Kiểm tra số lượng sản phẩm có đủ không
  const product = await Product.findById(cartItem.product);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error("Sản phẩm không đủ số lượng");
  }

  // Cập nhật số lượng
  cartItem.quantity = quantity;
  await cart.save();

  // Trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findById(cart._id).populate(
    "items.product",
    "name price image countInStock"
  );

  res.json(updatedCart);
});

/**
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Tìm giỏ hàng của người dùng
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Không tìm thấy giỏ hàng");
  }

  // Tìm sản phẩm trong giỏ hàng
  const cartItem = cart.items.id(itemId);

  if (!cartItem) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
  }

  // Xóa sản phẩm khỏi giỏ hàng
  cartItem.remove();
  await cart.save();

  // Trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findById(cart._id).populate(
    "items.product",
    "name price image countInStock"
  );

  res.json(updatedCart);
});

/**
 * @desc    Xóa toàn bộ giỏ hàng
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  // Tìm giỏ hàng của người dùng
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Không tìm thấy giỏ hàng");
  }

  // Xóa tất cả sản phẩm trong giỏ hàng
  cart.items = [];
  await cart.save();

  res.json({ message: "Giỏ hàng đã được xóa" });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
