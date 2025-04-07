const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Category Model
 * Đại diện cho danh mục sản phẩm trong hệ thống
 */
const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware để tự động tạo slug trước khi lưu
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi',
      trim: true
    });
  }
  next();
});

// Phương thức kiểm tra xem danh mục có đang hoạt động không
categorySchema.methods.isActiveCategory = function() {
  return this.isActive;
};

// Phương thức tạo slug từ tên danh mục
categorySchema.statics.generateSlug = function(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true
  });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;