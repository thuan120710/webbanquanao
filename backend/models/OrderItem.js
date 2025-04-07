const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    price: {
      type: Number,
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

// Phương thức tính tổng giá trị của item
orderItemSchema.methods.calculateTotal = function() {
  return this.price * this.quantity;
};

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;