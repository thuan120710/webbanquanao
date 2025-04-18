const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword,
  uploadAvatar
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: /api/users
router.route('/')
  .post(registerUser)
  .get(protect, admin, getUsers);

// Route: /api/users/login
router.post('/login', authUser);

// Route: /api/users/forgot-password
router.post('/forgot-password', forgotPassword);

// Route: /api/users/reset-password/:token
router.post('/reset-password/:token', resetPassword);

// Route: /api/users/profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Route: /api/users/profile/upload-avatar
router.post('/profile/upload-avatar', protect, upload.single('image'), uploadAvatar);

// Route: /api/users/:id
router.route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;