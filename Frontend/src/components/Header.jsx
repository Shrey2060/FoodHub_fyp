import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/images/Logo.png";
import "./Header.css";
import SearchBar from './SearchBar/SearchBar';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = sessionStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="container">
          {/* Logo */}
          <div className="logo">
            <Link to="/">
              <img src={Logo} alt="Food Hub" />
            </Link>
          </div>

          {/* Navigation Buttons */}
          <div className="nav-div">
            <button
              onClick={() => navigate("/home")}
              className={`nav-item ${
                location.pathname === "/" || location.pathname === "/home" ? "active" : ""
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/products")}
              className={`nav-item ${location.pathname === "/products" ? "active" : ""}`}
            >
              Menu
            </button>
            <button
              onClick={() => navigate("/bundles")}
              className={`nav-item ${location.pathname === "/bundles" ? "active" : ""}`}
            >
              Food Bundles
            </button>
            <button
              onClick={() => navigate("/pre-order")}
              className={`nav-item ${location.pathname === "/pre-order" ? "active" : ""}`}
            >
              Pre-Order
            </button>
            <button
              onClick={() => navigate("/cart")}
              className={`nav-item ${location.pathname === "/cart" ? "active" : ""}`}
            >
              🛒 Cart
            </button>

            {/* Orders Button (Visible Only if Logged In) */}
            {isLoggedIn && (
              <button
                onClick={() => navigate("/orders")}
                className={`nav-item ${location.pathname === "/orders" ? "active" : ""}`}
              >
                📋 Orders
              </button>
            )}
          </div>

          {/* Login/Signup/Logout Buttons */}
          <div className="auth-buttons">
            {isLoggedIn ? (
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <div className="btn-div">
                <button onClick={() => navigate("/login")} className="login-btn">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="signup-btn">
                  Signup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
