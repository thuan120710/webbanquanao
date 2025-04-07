const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand');

/**
 * @desc    Tạo thương hiệu mới
 * @route   POST /api/brands
 * @access  Private/Admin
 */
const createBrand = asyncHandler(async (req, res) => {
  const { name, description, logo, isActive } = req.body;

  // Kiểm tra xem thương hiệu đã tồn tại chưa
  const brandExists = await Brand.findOne({ name });

  if (brandExists) {
    res.status(400);
    throw new Error('Thương hiệu đã tồn tại');
  }

  const brand = await Brand.create({
    name,
    description,
    logo,
    isActive
  });

  if (brand) {
    res.status(201).json(brand);
  } else {
    res.status(400);
    throw new Error('Dữ liệu thương hiệu không hợp lệ');
  }
});

/**
 * @desc    Lấy tất cả thương hiệu
 * @route   GET /api/brands
 * @access  Public
 */
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({});
  res.json(brands);
});

/**
 * @desc    Lấy thông tin chi tiết của thương hiệu
 * @route   GET /api/brands/:id
 * @access  Public
 */
const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (brand) {
    res.json(brand);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

/**
 * @desc    Cập nhật thương hiệu
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
const updateBrand = asyncHandler(async (req, res) => {
  const { name, description, logo, isActive } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (brand) {
    // Kiểm tra xem tên mới có trùng với thương hiệu khác không
    if (name !== brand.name) {
      const brandExists = await Brand.findOne({ name });
      if (brandExists) {
        res.status(400);
        throw new Error('Tên thương hiệu đã tồn tại');
      }
    }

    brand.name = name || brand.name;
    brand.description = description || brand.description;
    brand.logo = logo || brand.logo;
    brand.isActive = isActive !== undefined ? isActive : brand.isActive;

    const updatedBrand = await brand.save();
    res.json(updatedBrand);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

/**
 * @desc    Xóa thương hiệu
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (brand) {
    await brand.deleteOne();
    res.json({ message: 'Đã xóa thương hiệu' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};