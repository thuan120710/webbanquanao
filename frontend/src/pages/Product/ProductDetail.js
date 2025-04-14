import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext"; // Import the CartContext
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import axios from "axios";
import ReviewList from "../../components/ReviewList";
import ReviewForm from "../../components/ReviewForm";
import { motion } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart(); // Get cart state and addToCart function from context
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/products/${id}`
        );
        console.log("Product details:", data);
        setProduct(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Lỗi khi tải chi tiết sản phẩm. Vui lòng thử lại sau.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const getBrandName = (brand) => {
    if (!brand) return "Không có";
    if (typeof brand === "object" && brand.name) return brand.name;
    return brand;
  };

  const getCategoryName = (category) => {
    if (!category) return "Không có";
    if (typeof category === "object" && category.name) return category.name;
    return category;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.countInStock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        ...product,
        quantity,
      });
      navigate("/cart");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReviewSubmitted = () => {
    setRefreshReviews(!refreshReviews);
    setReviewToEdit(null);
  };

  const handleEditReview = (review) => {
    setReviewToEdit(review);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50 },
    },
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString("vi-VN") + "đ" : "";
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 4, mb: 8 }}
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Button
        component={Link}
        to="/products"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        variant="text"
      >
        Quay lại danh sách sản phẩm
      </Button>

      <Grid container spacing={4}>
        <Grid
          item
          xs={12}
          md={6}
          component={motion.div}
          variants={itemVariants}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #eee",
            }}
          >
            <img
              src={product?.image}
              alt={product?.name}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "500px",
                objectFit: "contain",
                p: 2,
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600";
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box component={motion.div} variants={itemVariants}>
            <Typography variant="h4" component="h1" gutterBottom>
              {product?.name}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="h5"
                color="primary"
                sx={{ fontWeight: "bold", mr: 1 }}
              >
                {formatPrice(product?.price)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({product?.numReviews || 0} đánh giá)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" paragraph>
              {product?.description}
            </Typography>

            <Box sx={{ mt: 3, mb: 3 }}>
              <Chip
                label={product?.countInStock > 0 ? "Còn hàng" : "Hết hàng"}
                color={product?.countInStock > 0 ? "success" : "error"}
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Thương hiệu: ${getBrandName(product?.brand)}`}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Danh mục: ${getCategoryName(product?.category)}`}
                variant="outlined"
              />
            </Box>

            {product?.countInStock > 0 && (
              <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Số lượng:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleQuantityChange(val);
                    }}
                    InputProps={{
                      inputProps: {
                        min: 1,
                        max: product?.countInStock,
                        style: { textAlign: "center", width: "40px" },
                      },
                      disableUnderline: true,
                    }}
                    variant="standard"
                    sx={{ mx: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product?.countInStock}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                disabled={product?.countInStock === 0}
                fullWidth
                sx={{ py: 1.5 }}
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {product?.countInStock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="product tabs"
            component={motion.div}
            variants={itemVariants}
          >
            <Tab label="Chi tiết sản phẩm" id="tab-0" />
            <Tab label={`Đánh giá (${product?.numReviews || 0})`} id="tab-1" />
          </Tabs>
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0">
          {activeTab === 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin chi tiết
                </Typography>
                <Typography variant="body1" paragraph>
                  {product?.description || "Không có thông tin chi tiết."}
                </Typography>

                {/* Hiển thị thêm thông tin khác nếu có */}
                {product?.specifications && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Thông số kỹ thuật
                    </Typography>
                    <pre>{product.specifications}</pre>
                  </Box>
                )}
              </Paper>
            </motion.div>
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1">
          {activeTab === 1 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <ReviewForm
                productId={id}
                onReviewSubmitted={handleReviewSubmitted}
                reviewToEdit={reviewToEdit}
              />
              <ReviewList
                productId={id}
                key={refreshReviews ? "refresh" : "initial"}
                onEditReview={handleEditReview}
              />
            </motion.div>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetail;
