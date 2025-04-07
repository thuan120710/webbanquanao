const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Tạo danh mục mới
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Kiểm tra xem danh mục đã tồn tại chưa
  const categoryExists = await Category.findOne({ name });

  if (categoryExists) {
    res.status(400);
    throw new Error('Danh mục đã tồn tại');
  }

  // Tạo slug từ tên danh mục
  const slug = Category.generateSlug(name);

  // Kiểm tra xem slug đã tồn tại chưa
  const slugExists = await Category.findOne({ slug });
  if (slugExists) {
    res.status(400);
    throw new Error('Slug đã tồn tại, vui lòng chọn tên khác');
  }

  const category = await Category.create({
    name,
    description,
    slug,
    isActive: true
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error('Dữ liệu danh mục không hợp lệ');
  }
});

/**
 * @desc    Lấy tất cả danh mục
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
});

/**
 * @desc    Lấy thông tin chi tiết của danh mục
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy danh mục');
  }
});

/**
 * @desc    Cập nhật danh mục
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  const category = await Category.findById(req.params.id);

  if (category) {
    // Kiểm tra xem tên mới đã tồn tại chưa (nếu tên thay đổi)
    if (name && name !== category.name) {
      const categoryExists = await Category.findOne({ name });
      if (categoryExists) {
        res.status(400);
        throw new Error('Tên danh mục đã tồn tại');
      }
      // Cập nhật slug khi tên thay đổi
      category.slug = Category.generateSlug(name);
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.image = image || category.image;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy danh mục');
  }
});

/**
 * @desc    Xóa danh mục
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (category) {
    res.json({ message: 'Danh mục đã được xóa', category });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy danh mục');
  }
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};