import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Mock authentication state - in a real app, this would come from context or Redux
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${searchTerm}`);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">E-Shop</Link>
        </div>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
        
        <nav className="nav">
          <ul className="nav-links">
            <li>
              <Link to="/cart" className="cart-link">
                <span className="cart-icon">🛒</span>
                <span className="cart-text">Cart</span>
              </Link>
            </li>
            {isAuthenticated ? (
              <li>
                <Link to="/profile">Profile</Link>
              </li>
            ) : (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;