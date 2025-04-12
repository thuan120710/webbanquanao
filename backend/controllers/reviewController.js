const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Product = require("../models/Product");

/**
 * @desc    Tạo đánh giá mới cho sản phẩm
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);

  const { productId, rating, comment, title } = req.body;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }

  // Tạo đánh giá mới
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating: Number(rating),
    comment,
    title: title || "",
  });

  if (review) {
    // Cập nhật đánh giá trung bình của sản phẩm
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = totalRating / reviews.length;
    product.numReviews = reviews.length;
    await product.save();

    res.status(201).json({
      message: "Đánh giá đã được thêm",
      review,
    });
  } else {
    res.status(400);
    throw new Error("Dữ liệu đánh giá không hợp lệ");
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
    throw new Error("Không tìm thấy sản phẩm");
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "name avatar")
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
    .populate("product", "name image")
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
    .populate("user", "name email")
    .populate("product", "name image")
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
  const review = await Review.findById(req.params.id);

  if (review && review.user.toString() === req.user._id.toString()) {
    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.comment = req.body.comment || review.comment;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá hoặc không có quyền chỉnh sửa");
  }
});

/**
 * @desc    Xóa đánh giá
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  console.log("Review ID:", req.params.id);
  console.log("User ID:", req.user._id);

  try {
    const review = await Review.findById(req.params.id);

    if (review) {
      console.log("Review User ID:", review.user.toString());
    }

    if (review && review.user.toString() === req.user._id.toString()) {
      await Review.deleteOne({ _id: req.params.id });
      res.json({ message: "Đánh giá đã được xóa" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy đánh giá hoặc không có quyền xóa");
    }
  } catch (error) {
    console.error("Error removing review:", error);
    res.status(500).json({ message: "Lỗi khi xóa đánh giá" });
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
