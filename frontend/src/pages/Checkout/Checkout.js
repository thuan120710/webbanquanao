import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { 
    cart, 
    clearCart, 
    cartTotal,
    appliedCoupon,
    calculateDiscount,
    finalTotal 
  } = useCart();
  const { currentUser } = useAuth();
  const [error, setError] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    district: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleShippingInfoChange = (event) => {
    const { name, value } = event.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value,
    });
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const isFormValid = () => {
    return (
      shippingInfo.fullName &&
      shippingInfo.phoneNumber &&
      shippingInfo.address &&
      shippingInfo.city &&
      shippingInfo.district
    );
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Tính toán tổng tiền cuối cùng
      const totalAmount = finalTotal + calculateShipping() + calculateTax();
      
      const orderData = {
        orderItems: cart.map((item) => ({
          product: item.product?._id || item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        shippingAddress: {
          fullName: shippingInfo.fullName,
          phoneNumber: shippingInfo.phoneNumber,
          address: shippingInfo.address,
          city: shippingInfo.city,
          district: shippingInfo.district,
          notes: shippingInfo.notes,
          country: "Vietnam",
          postalCode: shippingInfo.district
        },
        paymentMethod: paymentMethod,
        taxPrice: calculateTax(),
        shippingPrice: calculateShipping(),
        itemsPrice: cartTotal,
        discountAmount: calculateDiscount(),
        couponCode: appliedCoupon?.code,
        totalPrice: totalAmount,
      };

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      // Tạo đơn hàng
      const orderResponse = await axios.post(
        `${API_BASE_URL}/api/orders`,
        orderData,
        config
      );
      
      const orderId = orderResponse.data._id;

      // Xử lý thanh toán dựa trên phương thức được chọn
      if (paymentMethod === 'vnpay') {
        try {
          const vnpayResponse = await axios.post(
            `${API_BASE_URL}/api/payments/vnpay/create-payment-url`,
            {
              orderId: orderId,
              amount: totalAmount
            },
            config
          );

          if (vnpayResponse.data.vnpayUrl) {
            // Lưu thông tin đơn hàng và URL thanh toán vào localStorage
            localStorage.setItem('pendingOrder', JSON.stringify({
              orderId,
              totalAmount,
              shippingInfo,
              paymentMethod: 'vnpay',
              vnpayUrl: vnpayResponse.data.vnpayUrl
            }));
            
            // Chuyển hướng đến trang xác nhận thanh toán
            navigate('/payment-confirmation');
            return;
          } else {
            throw new Error('Không nhận được URL thanh toán từ VNPAY');
          }
        } catch (vnpayError) {
          console.error('VNPAY payment error:', vnpayError);
          setError('Có lỗi xảy ra khi tạo liên kết thanh toán VNPAY. Vui lòng thử lại.');
          return;
        }
      } else {
        // Xử lý thanh toán COD
        clearCart();
        toast.success("Đặt hàng thành công!");
        navigate(`/order-success?orderId=${orderId}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setError(
        error.response?.data?.message ||
        "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = () => {
    return cartTotal > 500000 ? 0 : 30000;
  };

  const calculateTax = () => {
    return Math.round(cartTotal * 0.1);
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  // Kiểm tra nếu giỏ hàng trống
  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, textAlign: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Giỏ hàng của bạn đang trống
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Thanh toán
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="fullName"
                  name="fullName"
                  label="Họ và tên"
                  fullWidth
                  value={shippingInfo.fullName}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Số điện thoại"
                  fullWidth
                  value={shippingInfo.phoneNumber}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  id="address"
                  name="address"
                  label="Địa chỉ"
                  fullWidth
                  value={shippingInfo.address}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="city"
                  name="city"
                  label="Tỉnh/Thành phố"
                  fullWidth
                  value={shippingInfo.city}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="district"
                  name="district"
                  label="Quận/Huyện"
                  fullWidth
                  value={shippingInfo.district}
                  onChange={handleShippingInfoChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="notes"
                  name="notes"
                  label="Ghi chú"
                  fullWidth
                  multiline
                  rows={3}
                  value={shippingInfo.notes}
                  onChange={handleShippingInfoChange}
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay địa điểm giao hàng cụ thể."
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <FormControl component="fieldset">
              <Typography variant="h6" gutterBottom>
                Phương thức thanh toán
              </Typography>
              <RadioGroup
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <FormControlLabel
                  value="cod"
                  control={<Radio />}
                  label="Thanh toán khi nhận hàng (COD)"
                />
                <FormControlLabel
                  value="vnpay"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Thanh toán qua VNPAY</span>
                      <img 
                        src="/vnpay-logo.png" 
                        alt="VNPAY" 
                        style={{ height: 20 }}
                      />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tổng quan đơn hàng
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Tạm tính:</Typography>
                </Grid>
                <Grid item>
                  <Typography>{formatCurrency(cartTotal)}</Typography>
                </Grid>
              </Grid>
              
              {appliedCoupon && (
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography>Giảm giá:</Typography>
                  </Grid>
                  <Grid item>
                    <Typography color="error">
                      -{formatCurrency(calculateDiscount())}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Phí vận chuyển:</Typography>
                </Grid>
                <Grid item>
                  <Typography>
                    {calculateShipping() === 0
                      ? "Miễn phí"
                      : formatCurrency(calculateShipping())}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography>Thuế (10%):</Typography>
                </Grid>
                <Grid item>
                  <Typography>{formatCurrency(calculateTax())}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Tổng cộng:</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(finalTotal + calculateShipping() + calculateTax())}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Đặt hàng (${formatCurrency(
                  finalTotal + calculateShipping() + calculateTax()
                )})`
              )}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
