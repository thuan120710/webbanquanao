const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

/**
 * Lấy tất cả sản phẩm
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const { showDeleted, keyword, category, brand, minPrice, maxPrice, sort } = req.query;

  // Xây dựng điều kiện tìm kiếm
  const query = {};
  
  // Nếu không yêu cầu hiển thị sản phẩm đã xóa, chỉ lấy sản phẩm chưa xóa
  if (!showDeleted) {
    query.isDeleted = false;
  }

  // Tìm kiếm theo từ khóa
  if (keyword) {
    query.name = {
      $regex: keyword,
      $options: 'i'
    };
  }

  // Lọc theo danh mục
  if (category) {
    query.category = category;
  }

  // Lọc theo thương hiệu
  if (brand) {
    query.brand = brand;
  }

  // Lọc theo giá
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Sắp xếp
  let sortOption = {};
  if (sort) {
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  }

  const products = await Product.find(query)
    .populate('category', 'name')
    .populate('brand', 'name')
    .sort(sortOption);

  res.json(products);
});

/**
 * Lấy sản phẩm theo ID
 *  GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name')
    .populate('brand', 'name');

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

/**
 * Xóa mềm sản phẩm
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Thực hiện xóa mềm
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({ 
      message: 'Sản phẩm đã được xóa thành công',
      product: {
        _id: product._id,
        name: product.name,
        deletedAt: product.deletedAt
      }
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

/**
 * Tạo sản phẩm mới
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } = req.body;

  // Kiểm tra dữ liệu có hợp lệ không
  if (!name || !price || !description || !image || !brand || !category || countInStock === undefined) {
    res.status(400);
    throw new Error('Thiếu thông tin sản phẩm');
  }

  try {
    const product = new Product({
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
      rating: 0,
      numReviews: 0,
      isDeleted: false,
      deletedAt: null
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm' });
  }
});

/**
 Cập nhật sản phẩm
 PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

/**
Tạo đánh giá cho sản phẩm
POST /api/products/:id/reviews

 */
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Bạn đã đánh giá sản phẩm này rồi');
    }

    const review = {
      name: req.user.firstName + ' ' + req.user.lastName,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Đánh giá đã được thêm' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

// Lấy các sản phẩm bán chạy nhất
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(5);

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
};
