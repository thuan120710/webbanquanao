import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const CartContext = createContext();

const cartReducer = (state, action) => {
  try {
    switch (action.type) {
      case "ADD_TO_CART":
        const existingItem = state.items.find(
          (item) => item._id === action.payload._id
        );
        if (existingItem) {
          return {
            ...state,
            items: state.items.map((item) =>
              item._id === action.payload._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
        };

      case "REMOVE_FROM_CART":
        return {
          ...state,
          items: state.items.filter((item) => item._id !== action.payload),
        };

      case "UPDATE_QUANTITY":
        return {
          ...state,
          items: state.items.map((item) =>
            item._id === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        };

      case "CLEAR_CART":
        return {
          ...state,
          items: [],
        };

      case "LOAD_CART":
        return {
          ...state,
          items: action.payload || [],
        };

      default:
        return state;
    }
  } catch (error) {
    console.error("Error in cartReducer:", error);
    return state;
  }
};

// Custom toast options
const toastOptions = {
  icon: <CheckCircleIcon fontSize="small" />,
  className: "custom-toast",
};

const API_BASE_URL = "http://localhost:5000";

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const loadCart = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) return;

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(`${API_BASE_URL}/api/cart`, config);
        if (data && data.items) {
          dispatch({ type: "LOAD_CART", payload: data.items });
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        toast.error("Lỗi tải giỏ hàng", { autoClose: 2000 });
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(state.items));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
      toast.error("Lỗi lưu giỏ hàng", { autoClose: 2000 });
    }
  }, [state.items]);

  const addToCart = async (product) => {
    try {
      if (!product || !product._id) {
        throw new Error("Invalid product data");
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart`,
        { productId: product._id, quantity: 1 },
        config
      );

      dispatch({ type: "LOAD_CART", payload: data.items });
      toast.success("Đã thêm vào giỏ", toastOptions);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Không thể thêm sản phẩm", { autoClose: 2000 });
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(`${API_BASE_URL}/api/cart/${productId}`, config);
      dispatch({ type: "REMOVE_FROM_CART", payload: productId });
      toast.success("Đã xóa sản phẩm", toastOptions);
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Không thể xóa sản phẩm", { autoClose: 2000 });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (!productId) {
        throw new Error("Product ID is required");
      }

      if (quantity < 1) {
        toast.error("Số lượng phải > 0", { autoClose: 2000 });
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) {
        toast.error("Vui lòng đăng nhập", { autoClose: 2000 });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/api/cart/${productId}`,
        { quantity },
        config
      );

      if (data && data.items) {
        dispatch({ type: "LOAD_CART", payload: data.items });
        toast.success("Đã cập nhật số lượng", toastOptions);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật số lượng",
        { autoClose: 2000 }
      );
    }
  };

  const clearCart = () => {
    try {
      dispatch({ type: "CLEAR_CART" });
      toast.success("Đã xóa giỏ hàng", toastOptions);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Không thể xóa giỏ hàng", { autoClose: 2000 });
    }
  };

  const cartTotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const placeOrder = async (orderData) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      await axios.post("http://localhost:5000/api/orders", orderData, config);
      dispatch({ type: "CLEAR_CART" });

      toast.success("Đặt hàng thành công", toastOptions);
    } catch (error) {
      toast.error("Không thể đặt hàng", { autoClose: 2000 });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
