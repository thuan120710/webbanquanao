import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    countInStock: "",
    image: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/products");
      setProducts(data.products || []);
      setError(null);
    } catch (error) {
      setError("Lỗi khi tải danh sách sản phẩm");
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get("/api/brands");
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      brand: "",
      countInStock: "",
      image: "",
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.description ||
      !formData.category ||
      !formData.brand ||
      !formData.countInStock ||
      !formData.image
    ) {
      setSnackbar({
        open: true,
        message: "Vui lòng điền đầy đủ thông tin sản phẩm.",
        severity: "error",
      });
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      if (selectedProduct) {
        await axios.put(
          `/api/products/${selectedProduct._id}`,
          formData,
          config
        );
        setSnackbar({
          open: true,
          message: "Cập nhật sản phẩm thành công",
          severity: "success",
        });
      } else {
        await axios.post("/api/products", formData, config);
        setSnackbar({
          open: true,
          message: "Thêm sản phẩm thành công",
          severity: "success",
        });
      }

      fetchProducts();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Có lỗi xảy ra",
        severity: "error",
      });
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      console.log("Token gửi lên:", userInfo.token); // Log token từ localStorage

      const response = await axios.delete(`/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      console.log("Response từ server:", response); // Log response từ server
      setSnackbar({
        open: true,
        message: "Xóa sản phẩm thành công",
        severity: "success",
      });
      fetchProducts(); // Tải lại danh sách sản phẩm
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error); // Log lỗi từ frontend
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Lỗi khi xóa sản phẩm",
        severity: "error",
      });
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      countInStock: product.countInStock,
      image: product.image,
    });
    setOpenDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Find category and brand name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : "Không có danh mục";
  };

  const getBrandName = (brandId) => {
    const brand = brands.find((br) => br._id === brandId);
    return brand ? brand.name : "Không có thương hiệu";
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", pt: 2, pb: 4 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "white",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Tooltip title="Quay về Dashboard">
              <IconButton
                onClick={() => navigate("/admin")}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Quản lý sản phẩm
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              Thêm sản phẩm mới
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Tên sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giá</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thương hiệu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hình ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Không có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id} hover>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.price.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>{getCategoryName(product.category)}</TableCell>{" "}
                      {/* Show category name */}
                      <TableCell>{product.countInStock}</TableCell>
                      <TableCell>{getBrandName(product.brand)}</TableCell>{" "}
                      {/* Show brand name */}
                      <TableCell>
                        <img
                          src={product.image}
                          alt={product.name}
                          width={50}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Sửa sản phẩm">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(product)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa sản phẩm">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(product._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            {selectedProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              margin="dense"
              name="name"
              label="Tên sản phẩm"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Mô tả"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="price"
              label="Giá"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Thương hiệu</InputLabel>
              <Select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                label="Thương hiệu"
              >
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand._id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="countInStock"
              label="Số lượng trong kho"
              type="number"
              fullWidth
              value={formData.countInStock}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="image"
              label="URL hình ảnh"
              fullWidth
              value={formData.image}
              onChange={handleInputChange}
            />
            {formData.image && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Hình ảnh sản phẩm:
                </Typography>
                <img
                  src={formData.image}
                  alt={formData.name}
                  width="100%"
                  style={{ maxWidth: "300px", marginTop: "10px" }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                textTransform: "none",
                color: "text.secondary",
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                textTransform: "none",
                px: 3,
              }}
            >
              {selectedProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
            }}
            elevation={6}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ProductManagement;
