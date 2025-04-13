const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const transporter = require('../config/nodemailer');

/**
 * @desc    Xác thực người dùng & lấy token
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Tìm user theo email
  const user = await User.findOne({ email });

  // Kiểm tra user tồn tại và mật khẩu đúng
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không đúng');
  }
});

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Validate input
  if (!username || !email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin');
  }

  // Kiểm tra email hợp lệ
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Email không hợp lệ');
  }

  // Kiểm tra độ dài mật khẩu
  if (password.length < 8) {
    res.status(400);
    throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
  }

  try {
    // Kiểm tra user đã tồn tại chưa
    const userExistsByEmail = await User.findOne({ email });
    if (userExistsByEmail) {
      res.status(400);
      throw new Error('Email đã được sử dụng');
    }

    const userExistsByUsername = await User.findOne({ username });
    if (userExistsByUsername) {
      res.status(400);
      throw new Error('Tên đăng nhập đã tồn tại');
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Dữ liệu người dùng không hợp lệ');
    }
  } catch (error) {
    // Xử lý lỗi MongoDB duplicate key
    if (error.code === 11000) {
      res.status(400);
      if (error.keyPattern.email) {
        throw new Error('Email đã được sử dụng');
      } else if (error.keyPattern.username) {
        throw new Error('Tên đăng nhập đã tồn tại');
      } else {
        throw new Error('Người dùng đã tồn tại');
      }
    } else {
      throw error;
    }
  }
});

/**
 * @desc    Lấy thông tin người dùng
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user được set từ middleware protect
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
});

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    
    // Chỉ cập nhật password nếu được gửi lên
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
});

/**
 * @desc    Lấy danh sách tất cả người dùng
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  // Kiểm tra quyền admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Không có quyền thực hiện hành động này');
  }

  // Lấy tham số query
  const { showDeleted } = req.query;
  
  // Xây dựng điều kiện tìm kiếm
  const query = {};
  
  // Nếu không yêu cầu hiển thị người dùng đã xóa, chỉ lấy người dùng chưa xóa
  if (!showDeleted) {
    query.isDeleted = false;
  }

  const users = await User.find(query).select('-password');
  res.json(users);
});

/**
 * @desc    Xóa mềm người dùng
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  // Kiểm tra quyền admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Không có quyền thực hiện hành động này');
  }

  // Tìm user trước khi xóa
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }

  // Ngăn chặn admin xóa chính mình
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Không thể xóa tài khoản admin đang đăng nhập');
  }

  // Thực hiện xóa mềm
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();

  res.json({ 
    message: 'Người dùng đã được xóa thành công',
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      deletedAt: user.deletedAt
    }
  });
});

/**
 * @desc    Lấy thông tin người dùng theo ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
});

/**
 * @desc    Cập nhật thông tin người dùng (Admin)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.isAdmin = req.body.isAdmin ?? user.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
});

/**
 * @desc    Gửi email reset mật khẩu
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng với email này');
  }

  // Tạo token reset mật khẩu
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetExpires = Date.now() + 3600000; // 1 giờ

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save();

  // Tạo link reset mật khẩu
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Gửi email với template đẹp hơn
  const mailOptions = {
    from: `"Web Bán Quần Áo" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Yêu cầu đặt lại mật khẩu của bạn',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
  <!-- Header -->
  <div style="background-color: #2196f3; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h1 style="color: white; margin: 0;">Đặt Lại Mật Khẩu</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${user.firstName} ${user.lastName},</h2>
    
    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
    </p>

    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #2196f3; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 5px;
                font-weight: bold;
                display: inline-block;
                transition: background-color 0.3s ease-in-out;">
        Đặt Lại Mật Khẩu
      </a>
    </div>

    <!-- Link Backup -->
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #666; margin: 0 0 10px 0;">
        Nếu nút không hoạt động, bạn có thể copy và dán link sau vào trình duyệt:
      </p>
      <p style="word-break: break-all; margin: 0; color: #2196f3;">
        ${resetUrl}
      </p>
    </div>

    <!-- Warning -->
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="color: #856404; margin: 0;">
        <strong>Lưu ý:</strong><br>
        - Link này sẽ hết hạn sau 1 giờ<br>
        - Chỉ sử dụng một lần duy nhất
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    <p style="margin-top: 10px;">
      © 2024 Web Bán Quần Áo. Tất cả các quyền được bảo lưu.
    </p>
  </div>
</div>

    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email đặt lại mật khẩu đã được gửi' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500);
    throw new Error('Không thể gửi email đặt lại mật khẩu');
  }
});

/**
 * @desc    Đặt lại mật khẩu
 * @route   POST /api/users/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Mật khẩu đã được đặt lại thành công' });
});

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword
};