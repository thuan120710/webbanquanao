import React, { useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const { cart, setCart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(
          "http://localhost:5000/api/cart",
          config
        );
        setCart(data.items); // Ensure this matches the structure of your API response
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCart();
  }, [setCart]);

  const handleRemoveFromCart = async (productId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(`http://localhost:5000/api/cart/${productId}`, config);
      setCart(cart.filter((item) => item._id !== productId)); // Update local state
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Giỏ Hàng
      </Typography>

      {cart.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 4 }}>
          <ShoppingCartIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Giỏ hàng của bạn hiện tại trống
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/products")}
            sx={{ mt: 2 }}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              {cart.map((product) => (
                <Box key={product._id} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Box
                        sx={{
                          height: 120,
                          width: "100%",
                          bgcolor: "#f5f5f5",
                          borderRadius: 1,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden",
                          p: 1,
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/120x120?text=No+Image";
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {product.description?.substring(0, 100)}
                        {product.description?.length > 100 ? "..." : ""}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {product.price?.toLocaleString("vi-VN")}đ
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(
                              product._id,
                              product.quantity - 1
                            )
                          }
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography
                          sx={{ mx: 2, minWidth: "40px", textAlign: "center" }}
                        >
                          {product.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(
                              product._id,
                              product.quantity + 1
                            )
                          }
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveFromCart(product._id)}
                        fullWidth
                      >
                        Xóa
                      </Button>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: "sticky", top: "80px" }}>
              <Typography variant="h6" gutterBottom>
                Tổng giỏ hàng
              </Typography>
              <Box sx={{ my: 2 }}>
                <Grid container justifyContent="space-between">
                  <Typography variant="body1">Tạm tính:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </Typography>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="body1">Phí vận chuyển:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    0đ
                  </Typography>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container justifyContent="space-between">
                  <Typography variant="h6">Tổng cộng:</Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    sx={{ fontWeight: 600 }}
                  >
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </Typography>
                </Grid>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate("/checkout")}
                sx={{ mt: 2 }}
              >
                Thanh Toán
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate("/products")}
                sx={{ mt: 2 }}
              >
                Tiếp tục mua sắm
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Cart;
