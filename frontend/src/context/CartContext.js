import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CartContext = createContext();

const cartReducer = (state, action) => {
  try {
    switch (action.type) {
      case 'ADD_TO_CART':
        const existingItem = state.items.find(item => item._id === action.payload._id);
        if (existingItem) {
          return {
            ...state,
            items: state.items.map(item =>
              item._id === action.payload._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };

      case 'REMOVE_FROM_CART':
        return {
          ...state,
          items: state.items.filter(item => item._id !== action.payload)
        };

      case 'UPDATE_QUANTITY':
        return {
          ...state,
          items: state.items.map(item =>
            item._id === action.payload.id
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
        };

      case 'CLEAR_CART':
        return {
          ...state,
          items: []
        };

      case 'LOAD_CART':
        return {
          ...state,
          items: action.payload
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('Error in cartReducer:', error);
    return state;
  }
};

// Custom toast options
const toastOptions = {
  icon: <CheckCircleIcon fontSize="small" />,
  className: 'custom-toast'
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage and verify products with database
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          
          // Verify each product with the database
          const verifiedCart = [];
          
          for (const item of parsedCart) {
            try {
              // Verify this product exists in database
              const { data } = await axios.get(`http://localhost:5000/api/products/${item._id}`);
              
              // If product exists, add it to verified cart with current quantity
              if (data) {
                verifiedCart.push({
                  ...data,
                  quantity: item.quantity
                });
              }
            } catch (err) {
              console.error(`Product with ID ${item._id} not found in database`);
              // Skip this product if it doesn't exist
              continue;
            }
          }
          
          dispatch({ type: 'LOAD_CART', payload: verifiedCart });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        toast.error('Lỗi tải giỏ hàng', { autoClose: 2000 });
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      toast.error('Lỗi lưu giỏ hàng', { autoClose: 2000 });
    }
  }, [state.items]);

  const addToCart = async (product) => {
    try {
      if (!product || !product._id) {
        throw new Error('Invalid product data');
      }
      
      // Verify product is still in database before adding
      const { data } = await axios.get(`http://localhost:5000/api/products/${product._id}`);
      
      if (!data) {
        throw new Error('Sản phẩm không tồn tại trong cơ sở dữ liệu');
      }
      
      // Use latest product data from database
      dispatch({ type: 'ADD_TO_CART', payload: data });
      toast.success('Đã thêm vào giỏ', toastOptions);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Không thể thêm sản phẩm', { autoClose: 2000 });
    }
  };

  const removeFromCart = (productId) => {
    try {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      toast.success('Đã xóa sản phẩm', toastOptions);
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Không thể xóa sản phẩm', { autoClose: 2000 });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        toast.error('Số lượng phải > 0', { autoClose: 2000 });
        return;
      }
      
      // Verify product still exists before updating quantity
      const { data } = await axios.get(`http://localhost:5000/api/products/${productId}`);
      
      if (!data) {
        throw new Error('Sản phẩm không tồn tại trong cơ sở dữ liệu');
      }
      
      // Verify there's enough stock
      if (data.countInStock < quantity) {
        toast.error(`Chỉ còn ${data.countInStock} sản phẩm`, { autoClose: 2000 });
        // Set to maximum available quantity
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: productId, quantity: data.countInStock }
        });
        return;
      }
      
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id: productId, quantity }
      });
      toast.success('Đã cập nhật số lượng', toastOptions);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Không thể cập nhật', { autoClose: 2000 });
    }
  };

  const clearCart = () => {
    try {
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Đã xóa giỏ hàng', toastOptions);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Không thể xóa giỏ hàng', { autoClose: 2000 });
    }
  };

  const cartTotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 