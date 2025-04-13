import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get("/api/orders/history", config);
        console.log("Order history raw data:", JSON.stringify(data, null, 2));
        setOrderHistory(data);
      } catch (err) {
        console.error("Error fetching order history:", err);
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [user.token]);

  const handleViewOrderDetails = (orderId) => {
    navigate(`/profile/orders/${orderId}`);
  };

  const handleViewProductDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getChipColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      case "processing":
        return "warning";
      default:
        return "primary";
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );

  // Debug: Kiểm tra cấu trúc dữ liệu
  console.log("Order history state:", orderHistory);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Lịch sử đặt hàng
      </Typography>

      {orderHistory.length === 0 ? (
        <Box sx={{ textAlign: "center", p: 5 }}>
          <Typography>Bạn chưa có đơn hàng nào</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orderHistory.map((historyItem) => {
            // Debug: Kiểm tra cấu trúc của từng historyItem
            console.log("History item:", historyItem);
            console.log("Order data:", historyItem.order);

            // Kiểm tra nếu không có dữ liệu đơn hàng
            if (!historyItem.order) {
              return (
                <Grid item xs={12} key={historyItem._id}>
                  <Alert severity="warning">
                    Không thể tải thông tin đơn hàng
                  </Alert>
                </Grid>
              );
            }

            return (
              <Grid item xs={12} key={historyItem._id}>
                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="h6">
                        Mã đơn hàng: {historyItem.order._id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ngày đặt:{" "}
                        {new Date(historyItem.createdAt).toLocaleDateString()}{" "}
                        {new Date(historyItem.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={historyItem.status}
                      color={getChipColor(historyItem.status)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Sản phẩm đã đặt:
                  </Typography>

                  {historyItem.order.orderItems &&
                  historyItem.order.orderItems.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="center">Hình ảnh</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="right">Đơn giá</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {historyItem.order.orderItems.map((item, index) => {
                            // Debug: Kiểm tra từng sản phẩm
                            console.log(`Item ${index}:`, item);
                            return (
                              <TableRow
                                key={item._id || `item-${index}`}
                                hover
                                onClick={() =>
                                  item.product && item.product._id
                                    ? handleViewProductDetails(item.product._id)
                                    : handleViewProductDetails(item.product)
                                }
                                sx={{ cursor: "pointer" }}
                              >
                                <TableCell component="th" scope="row">
                                  <Typography variant="body2">
                                    {item.name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          objectFit: "contain",
                                        }}
                                      />
                                    ) : (
                                      <Box
                                        sx={{
                                          width: "50px",
                                          height: "50px",
                                          bgcolor: "grey.200",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography variant="caption">
                                          Không có ảnh
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {item.quantity}
                                </TableCell>
                                <TableCell align="right">
                                  {item.price?.toLocaleString()}đ
                                </TableCell>
                                <TableCell align="right">
                                  {(
                                    item.price * item.quantity
                                  )?.toLocaleString()}
                                  đ
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Không có thông tin sản phẩm
                    </Alert>
                  )}

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        Tổng tiền:{" "}
                        {historyItem.order.totalPrice?.toLocaleString()}đ
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phương thức thanh toán:{" "}
                        {historyItem.order.paymentMethod}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        handleViewOrderDetails(historyItem.order._id)
                      }
                    >
                      Xem chi tiết đơn hàng
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default OrderHistory;
