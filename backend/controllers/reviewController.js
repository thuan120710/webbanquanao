const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');

/**
 * @desc    Tạo đánh giá mới cho sản phẩm
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, title } = req.body;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }

  // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
  const alreadyReviewed = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Bạn đã đánh giá sản phẩm này rồi');
  }

  // Tạo đánh giá mới
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating: Number(rating),
    comment,
    title: title || '',
  });

  if (review) {
    // Cập nhật rating trung bình của sản phẩm
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = totalRating / reviews.length;
    product.numReviews = reviews.length;
    await product.save();

    res.status(201).json({
      message: 'Đánh giá đã được thêm',
      review,
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu đánh giá không hợp lệ');
  }
});

/**
 * @desc    Lấy tất cả đánh giá của một sản phẩm
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }

  const reviews = await Review.find({ product: productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

/**
 * @desc    Lấy tất cả đánh giá của người dùng hiện tại
 * @route   GET /api/reviews/my
 * @access  Private
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name image')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

/**
 * @desc    Lấy tất cả đánh giá (chỉ admin)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
const getAllReviews = asyncHandler(async (req, res) => {
  // Phân trang
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Review.countDocuments({});
  const reviews = await Review.find({})
    .populate('user', 'name email')
    .populate('product', 'name image')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    reviews,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Cập nhật đánh giá
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;

  const review = await Review.findById(req.params.id);

  if (review) {
    // Kiểm tra quyền cập nhật (chỉ người tạo đánh giá mới có thể cập nhật)
    if (review.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Không có quyền cập nhật đánh giá này');
    }

    review.rating = Number(rating) || review.rating;
    review.comment = comment || review.comment;
    review.title = title !== undefined ? title : review.title;

    const updatedReview = await review.save();

    // Cập nhật rating trung bình của sản phẩm
    const productId = review.product;
    const reviews = await Review.find({ product: productId });
    const product = await Product.findById(productId);
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = totalRating / reviews.length;
    await product.save();

    res.json(updatedReview);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }
});

/**
 * @desc    Xóa đánh giá
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    // Kiểm tra quyền xóa (chỉ người tạo đánh giá hoặc admin mới có thể xóa)
    if (
      review.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      res.status(401);
      throw new Error('Không có quyền xóa đánh giá này');
    }

    const productId = review.product;
    await review.remove();

    // Cập nhật rating trung bình của sản phẩm
    const reviews = await Review.find({ product: productId });
    if (reviews.length > 0) {
      const product = await Product.findById(productId);
      const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
      product.rating = totalRating / reviews.length;
      product.numReviews = reviews.length;
      await product.save();
    } else {
      // Nếu không còn đánh giá nào, đặt rating về 0
      const product = await Product.findById(productId);
      product.rating = 0;
      product.numReviews = 0;
      await product.save();
    }

    res.json({ message: 'Đánh giá đã được xóa' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }
});

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};