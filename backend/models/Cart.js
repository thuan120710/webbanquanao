const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Phương thức tính tổng giá trị giỏ hàng
cartSchema.methods.calculateTotalPrice = function() {
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  return this.totalPrice;
};

// Phương thức thêm sản phẩm vào giỏ hàng
cartSchema.methods.addItem = function(item) {
  const existingItemIndex = this.items.findIndex(
    (i) => i.product.toString() === item.product.toString()
  );

  if (existingItemIndex >= 0) {
    this.items[existingItemIndex].quantity += item.quantity;
  } else {
    this.items.push(item);
  }

  this.calculateTotalPrice();
  return this;
};

// Phương thức xóa sản phẩm khỏi giỏ hàng
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  this.calculateTotalPrice();
  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;