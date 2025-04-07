const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// Lấy tất cả sản phẩm
const getProducts = asyncHandler(async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
          name: { $regex: req.query.keyword, $options: "i" },
        }
      : {};

    if (req.query.category) keyword.category = req.query.category;
    if (req.query.brand) keyword.brand = req.query.brand;

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .populate('brand', 'name')
      .populate('category', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    console.log('Products with populated data:', products);
    
    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      pageSize,
      totalProducts: count,
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Lấy chi tiết sản phẩm theo ID
const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name')
      .populate('category', 'name');

    if (product) {
      console.log('Product with populated data:', product);
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy sản phẩm");
    }
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: error.message });
  }
});

// Xóa sản phẩm
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // Lấy sản phẩm theo ID

    if (!product) {
      console.log(`Không tìm thấy sản phẩm với ID: ${req.params.id}`);
      res.status(404);
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Xóa sản phẩm bằng findByIdAndDelete
    await Product.findByIdAndDelete(req.params.id);

    console.log(`Sản phẩm đã được xóa: ${product.name}`);
    res.json({ message: "Sản phẩm đã được xóa" });
  } catch (error) {
    console.error(`Lỗi khi xóa sản phẩm: ${error.message}`); // Log chi tiết lỗi
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
  }
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  // Log dữ liệu nhận được từ frontend
  console.log("Dữ liệu sản phẩm nhận được:", req.body); // Log toàn bộ dữ liệu nhận được từ frontend

  // Kiểm tra dữ liệu có hợp lệ không
  if (
    !name ||
    !price ||
    !description ||
    !image ||
    !brand ||
    !category ||
    countInStock === undefined
  ) {
    // Log thông báo nếu thiếu trường nào
    console.log("Thiếu thông tin sản phẩm:", {
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
    });

    res.status(400);
    throw new Error("Thiếu thông tin sản phẩm");
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
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error); // Log lỗi chi tiết
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
  }
});

// Cập nhật thông tin sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock =
      countInStock !== undefined ? countInStock : product.countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
  }
});

// Tạo đánh giá cho sản phẩm
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    const review = {
      name: req.user.firstName + " " + req.user.lastName,
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
    res.status(201).json({ message: "Đánh giá đã được thêm" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm");
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
