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

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error("Insufficient stock");
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      items: [
        {
          product: productId,
          quantity,
          name: product.name,
          image: product.image,
          price: product.price,
        },
      ],
    });
  } else {
    const existItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existItem) {
      existItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        name: product.name,
        image: product.image,
        price: product.price,
      });
    }
  }

  await cart.save();
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

  const product = await Product.findById(cartItem.product);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error("Insufficient stock");
  }

  cartItem.quantity = quantity;
  await cart.save();

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
 * @desc    Xóa toàn bộ giỏ hàng
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = [];
  await cart.save();

  res.json({ message: "Cart cleared" });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
