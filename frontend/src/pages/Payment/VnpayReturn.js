import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const VnpayReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');

        if (!orderId) {
          setError('Không tìm thấy thông tin đơn hàng');
          setLoading(false);
          return;
        }

        setPaymentStatus(status);

        // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
        if (status === 'completed') {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };

          await axios.put(
            `${API_BASE_URL}/api/orders/${orderId}/pay`,
            {},
            config
          );
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking payment status:', error);
        setError('Có lỗi xảy ra khi kiểm tra trạng thái thanh toán');
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [location]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang kiểm tra trạng thái thanh toán...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              {paymentStatus === 'completed'
                ? 'Thanh toán thành công!'
                : 'Thanh toán thất bại'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {paymentStatus === 'completed'
                ? 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán thành công.'
                : 'Rất tiếc, thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
              >
                Tiếp tục mua sắm
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/orders')}
              >
                Xem đơn hàng
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default VnpayReturn; 