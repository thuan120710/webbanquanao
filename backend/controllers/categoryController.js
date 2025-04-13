const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

/**
 Tạo danh mục mới
 POST /api/categories

 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, order } = req.body;

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
    image,
    order,
    isActive: true,
    isDeleted: false,
    deletedAt: null
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error('Dữ liệu danh mục không hợp lệ');
  }
});

/**
Lấy tất cả danh mục
GET /api/categories

 */
const getCategories = asyncHandler(async (req, res) => {
  const { showDeleted, sort } = req.query;

  // Xây dựng điều kiện tìm kiếm
  const query = {};
  
  // Nếu không yêu cầu hiển thị danh mục đã xóa, chỉ lấy danh mục chưa xóa
  if (!showDeleted) {
    query.isDeleted = false;
  }

  // Sắp xếp
  let sortOption = { order: 1 }; // Mặc định sắp xếp theo order
  if (sort) {
    switch (sort) {
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
    }
  }

  const categories = await Category.find(query).sort(sortOption);
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
  const { name, description, image, order, isActive } = req.body;

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
    category.order = order !== undefined ? order : category.order;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy danh mục');
  }
});

/**
 * @desc    Xóa mềm danh mục
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    // Thực hiện xóa mềm
    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();

    res.json({ 
      message: 'Danh mục đã được xóa thành công',
      category: {
        _id: category._id,
        name: category.name,
        deletedAt: category.deletedAt
      }
    });
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
  deleteCategory
};