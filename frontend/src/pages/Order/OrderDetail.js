import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(
          `http://localhost:5000/api/orders/${id}`,
          config
        );
        setOrder(data);
      } catch (error) {
        setError(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang xử lý':
        return 'warning';
      case 'Đã giao hàng':
        return 'success';
      case 'Đã hủy':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Không tìm thấy đơn hàng</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Chi tiết đơn hàng #{order._id}
            </Typography>
            <Chip
              label={order.status || 'Đang xử lý'}
              color={getStatusColor(order.status)}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                <strong>Người nhận:</strong> {order.shippingAddress.fullName}
              </Typography>
              <Typography>
                <strong>Số điện thoại:</strong> {order.shippingAddress.phoneNumber}
              </Typography>
              <Typography>
                <strong>Địa chỉ:</strong> {order.shippingAddress.address}
              </Typography>
              <Typography>
                <strong>Quận/Huyện:</strong> {order.shippingAddress.district}
              </Typography>
              <Typography>
                <strong>Tỉnh/Thành phố:</strong> {order.shippingAddress.city}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin thanh toán
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                <strong>Phương thức:</strong>{' '}
                {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong>{' '}
                {order.isPaid ? (
                  <Chip
                    label={`Đã thanh toán - ${format(new Date(order.paidAt), 'dd/MM/yyyy HH:mm', {
                      locale: vi,
                    })}`}
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip label="Chưa thanh toán" color="warning" size="small" />
                )}
              </Typography>
              <Typography>
                <strong>Ngày đặt hàng:</strong>{' '}
                {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sản phẩm đã đặt
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell align="right">Giá</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Tổng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: 'contain',
                          marginRight: 10,
                        }}
                      />
                      {item.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {item.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">Tạm tính:</Typography>
              <Typography variant="subtitle1">Phí vận chuyển:</Typography>
              <Typography variant="subtitle1">Thuế (10%):</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6">Tổng cộng:</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" align="right">
                {order.itemsPrice?.toLocaleString('vi-VN')}đ
              </Typography>
              <Typography variant="subtitle1" align="right">
                {order.shippingPrice?.toLocaleString('vi-VN')}đ
              </Typography>
              <Typography variant="subtitle1" align="right">
                {order.taxPrice?.toLocaleString('vi-VN')}đ
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" align="right">
                {order.totalPrice?.toLocaleString('vi-VN')}đ
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderDetail; 