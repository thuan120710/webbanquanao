import React, { useState } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { cart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    district: '',
    notes: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  const handleShippingInfoChange = (event) => {
    const { name, value } = event.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
  };
  
  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };
  
  const isFormValid = () => {
    return shippingInfo.fullName &&
      shippingInfo.phoneNumber &&
      shippingInfo.address &&
      shippingInfo.city &&
      shippingInfo.district;
  };
  
  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          image: item.images && item.images.length > 0 ? item.images[0] : 'default-image.jpg',
          price: item.price,
          product: item._id,
        })),
        shippingAddress: {
          address: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.district,
          country: 'Vietnam',
        },
        paymentMethod: paymentMethod,
        taxPrice: calculateTax(),
        shippingPrice: calculateShipping(),
        totalPrice: calculateTotal()
      };
      
      // Gọi API để tạo đơn hàng
      const response = await createOrder(orderData);
      console.log('Đơn hàng đã được tạo:', response.data);
      
      // Xóa giỏ hàng sau khi đặt hàng thành công
      clearCart();
      
      // Chuyển hướng đến trang thành công
      toast.success('Đặt hàng thành công!');
      navigate('/order-success');
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Tính toán tổng tiền
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 500000 ? 0 : 30000;
  };
  
  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.1);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };
  
  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };
  
  // Kiểm tra nếu giỏ hàng trống
  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
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
            onClick={() => navigate('/')}
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
          
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Phương thức thanh toán
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="payment-method"
                name="paymentMethod"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <FormControlLabel value="cod" control={<Radio />} label="Thanh toán khi nhận hàng (COD)" />
                <FormControlLabel value="banking" control={<Radio />} label="Chuyển khoản ngân hàng" />
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handlePlaceOrder}
                disabled={loading || !isFormValid()}
              >
                {loading ? <CircularProgress size={24} /> : 'Đặt hàng ngay'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Đơn hàng của bạn
            </Typography>
            
            {cart.map((item) => (
              <Box key={item._id} sx={{ py: 2, borderBottom: '1px solid #eee' }}>
                <Grid container>
                  <Grid item xs={8}>
                    <Typography variant="body1">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} x {formatCurrency(item.price)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="body1">{formatCurrency(item.price * item.quantity)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body1">Tạm tính:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1">{formatCurrency(calculateSubtotal())}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body1">Phí vận chuyển:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1">
                    {calculateShipping() === 0 ? 'Miễn phí' : formatCurrency(calculateShipping())}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body1">Thuế (10%):</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1">{formatCurrency(calculateTax())}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="h6">Tổng cộng:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color="primary.main">{formatCurrency(calculateTotal())}</Typography>
                </Grid>
              </Grid>
            </Box>
            
            {calculateShipping() === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Bạn được miễn phí vận chuyển!
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;