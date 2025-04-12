import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const orderId = new URLSearchParams(location.search).get('orderId');

  const handleViewOrder = () => {
    if (user?.role === 'admin') {
      navigate(`/admin/orders/${orderId}`);
    } else {
      navigate(`/profile/orders/${orderId}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Đặt hàng thành công!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xử lý và sẽ được giao trong thời gian sớm nhất.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Một email xác nhận đã được gửi đến địa chỉ email của bạn với thông tin chi tiết về đơn hàng.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleViewOrder}
            sx={{ mr: 2 }}
          >
            XEM ĐƠN HÀNG
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/products')}
          >
            TIẾP TỤC MUA SẮM
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderSuccess; 