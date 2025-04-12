const mongoose = require('mongoose');

/**
 * Brand Model
 * Đại diện cho thương hiệu sản phẩm trong hệ thống
 */
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    country: {
      type: String,
      required: false,
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
    timestamps: true
  }
);

// Phương thức kiểm tra xem thương hiệu có được đánh dấu là nổi bật không
brandSchema.methods.isFeatured = function() {
  return this.featured;
};

// Phương thức kiểm tra xem thương hiệu đã bị xóa mềm không
brandSchema.methods.isDeletedBrand = function() {
  return this.isDeleted;
};

// Phương thức tạo slug từ tên thương hiệu
brandSchema.statics.createSlug = function(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Middleware để thêm điều kiện tìm kiếm không bao gồm các thương hiệu đã xóa mềm
brandSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

brandSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;