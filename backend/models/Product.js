const mongoose = require('mongoose');

/**
 * Product Model
 * Đại diện cho sản phẩm trong hệ thống
 */
const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Phương thức kiểm tra sản phẩm còn hàng
productSchema.methods.isInStock = function() {
  return this.countInStock > 0;
};

// Phương thức kiểm tra sản phẩm đã bị xóa mềm
productSchema.methods.isDeletedProduct = function() {
  return this.isDeleted;
};

// Phương thức giảm số lượng khi đặt hàng
productSchema.methods.decreaseStock = function(quantity) {
  if (this.countInStock >= quantity) {
    this.countInStock -= quantity;
    return true;
  }
  return false;
};

// Middleware để thêm điều kiện tìm kiếm không bao gồm các sản phẩm đã xóa mềm
productSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

productSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;