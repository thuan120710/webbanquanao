import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePayment } from '../../context/PaymentContext';
import { Container, Paper, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyPayment, paymentStatus } = usePayment();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const verifyPaymentResult = async () => {
      try {
        await verifyPayment(Object.fromEntries(queryParams));
      } catch (error) {
        console.error('Lỗi khi xác thực thanh toán:', error);
      }
    };

    if (queryParams.toString()) {
      verifyPaymentResult();
    }
  }, [location.search, verifyPayment]);

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Paper elevation={3} style={{ padding: '30px', textAlign: 'center' }}>
        {paymentStatus.success ? (
          <>
            <CheckCircleIcon color="success" style={{ fontSize: 60, marginBottom: '20px' }} />
            <Typography variant="h5" gutterBottom>
              Thanh toán thành công!
            </Typography>
            <Typography variant="body1" paragraph>
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận.
            </Typography>
          </>
        ) : paymentStatus.error ? (
          <>
            <ErrorIcon color="error" style={{ fontSize: 60, marginBottom: '20px' }} />
            <Typography variant="h5" gutterBottom>
              Thanh toán thất bại
            </Typography>
            <Typography variant="body1" color="error" paragraph>
              {paymentStatus.error}
            </Typography>
          </>
        ) : (
          <Typography variant="body1">
            Đang xử lý kết quả thanh toán...
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleContinueShopping}
          style={{ marginTop: '20px' }}
        >
          Tiếp tục mua sắm
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentResult;