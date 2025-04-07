import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link để sử dụng cho việc điều hướng

const API_URL = "http://localhost:5000";

// Helper functions
const getBrandName = (brand) => {
  if (!brand) return 'Không có';
  if (typeof brand === 'object' && brand.name) return brand.name;
  return brand;
};

const getCategoryName = (category) => {
  if (!category) return 'Không có';
  if (typeof category === 'object' && category.name) return category.name;
  return category;
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Lấy dữ liệu sản phẩm từ backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/products?keyword=${keyword}&pageNumber=${pageNumber}`);
        console.log('Products data:', data);
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
        setTotalProducts(data.totalProducts);
      } catch (error) {
        setError('Lỗi khi tải sản phẩm. Vui lòng thử lại sau.');
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, pageNumber]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Danh sách sản phẩm
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ color: "error.main", textAlign: "center", mt: 2 }}>
          <Typography variant="h6">{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image}
                  alt={product.name}
                  sx={{ objectFit: "contain" }}
                />
                <CardContent>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: "bold" }}
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    {product.description}
                  </Typography>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Thương hiệu: {getBrandName(product.brand)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Danh mục: {getCategoryName(product.category)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {product.price.toLocaleString("vi-VN")}đ
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {product.countInStock} in stock
                    </Typography>
                  </Box>
                  <Link
                    to={`/product/${product._id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Button variant="contained" sx={{ mt: 2 }}>
                      Xem Chi Tiết
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ProductList;
