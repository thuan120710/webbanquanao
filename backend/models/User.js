const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Đại diện cho người dùng trong hệ thống
 */
const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password chỉ bắt buộc khi không có googleId
      },
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: {
      type: String,
      default: ''
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

// Phương thức lấy tên đầy đủ
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Phương thức kiểm tra quyền admin
userSchema.methods.isAdminUser = function() {
  return this.isAdmin;
};

// Phương thức kiểm tra tài khoản đã bị xóa mềm
userSchema.methods.isDeletedUser = function() {
  return this.isDeleted;
};

// Phương thức so sánh mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware để mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Middleware để thêm điều kiện tìm kiếm không bao gồm các bản ghi đã xóa mềm
userSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

userSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

const User = mongoose.model('User', userSchema);

module.exports = User;