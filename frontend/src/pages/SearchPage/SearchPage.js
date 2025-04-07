import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './SearchPage.css';

// Components
import ProductCard from '../components/ProductCard';

const SearchPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    price: '',
    rating: '',
    sort: 'newest'
  });
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to the backend with filters
        // For now, we'll use mock data
        const mockProducts = [
          {
            _id: '1',
            name: 'Wireless Headphones',
            image: 'https://via.placeholder.com/300',
            description: 'High-quality wireless headphones with noise cancellation',
            brand: 'AudioTech',
            category: 'electronics',
            price: 99.99,
            countInStock: 10,
            rating: 4.5,
            numReviews: 12,
          },
          {
            _id: '2',
            name: 'Smartphone X',
            image: 'https://via.placeholder.com/300',
            description: 'Latest smartphone with advanced features',
            brand: 'TechGiant',
            category: 'electronics',
            price: 699.99,
            countInStock: 7,
            rating: 4.0,
            numReviews: 8,
          },
          {
            _id: '3',
            name: 'Coffee Maker',
            image: 'https://via.placeholder.com/300',
            description: 'Automatic coffee maker with timer',
            brand: 'HomeAppliances',
            category: 'home',
            price: 49.99,
            countInStock: 5,
            rating: 4.2,
            numReviews: 10,
          },
          {
            _id: '4',
            name: 'Running Shoes',
            image: 'https://via.placeholder.com/300',
            description: 'Comfortable running shoes for all terrains',
            brand: 'SportyGear',
            category: 'fashion',
            price: 79.99,
            countInStock: 15,
            rating: 4.7,
            numReviews: 20,
          },
        ];

        // Filter products based on keyword and category
        let filteredProducts = mockProducts;
        
        if (keyword) {
          filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(keyword.toLowerCase()) ||
            product.description.toLowerCase().includes(keyword.toLowerCase())
          );
        }
        
        if (category) {
          filteredProducts = filteredProducts.filter(product => 
            product.category === category
          );
        }
        
        // Apply additional filters
        if (filters.price) {
          const [min, max] = filters.price.split('-').map(Number);
          filteredProducts = filteredProducts.filter(product => 
            product.price >= min && (max ? product.price <= max : true)
          );
        }
        
        if (filters.rating) {
          const minRating = Number(filters.rating);
          filteredProducts = filteredProducts.filter(product => 
            product.rating >= minRating
          );
        }
        
        // Apply sorting
        switch (filters.sort) {
          case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
          case 'newest':
          default:
            // Assume newest is default (no sorting needed for mock data)
            break;
        }
        
        setProducts(filteredProducts);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch products');
        setLoading(false);
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, [keyword, category, filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>
          {keyword ? `Search results for "${keyword}"` : 'All Products'}
          {category && ` in ${category}`}
        </h1>
        <p>{products.length} products found</p>
      </div>
      
      <div className="search-container">
        <div className="filter-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Price Range</label>
              <select 
                name="price" 
                value={filters.price} 
                onChange={handleFilterChange}
              >
                <option value="">All Prices</option>
                <option value="0-50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200-500">$200 - $500</option>
                <option value="500-">$500 & Above</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Rating</label>
              <select 
                name="rating" 
                value={filters.rating} 
                onChange={handleFilterChange}
              >
                <option value="">All Ratings</option>
                <option value="4">4★ & Above</option>
                <option value="3">3★ & Above</option>
                <option value="2">2★ & Above</option>
                <option value="1">1★ & Above</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort By</label>
              <select 
                name="sort" 
                value={filters.sort} 
                onChange={handleFilterChange}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="search-results">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : products.length === 0 ? (
            <div className="no-results">
              <p>No products found matching your criteria.</p>
              <Link to="/" className="back-to-home">Back to Home</Link>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;