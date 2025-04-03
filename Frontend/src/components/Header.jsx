import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/images/Logo.png";
import "./Header.css";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setIsLoggedIn(true);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setIsLoggedIn(false);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  return (
    <header className="header">
      <div className="container">
        {/* Logo */}
        <div className="logo">
          <img src={Logo} alt="Food Hub" />
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

        {/* Login / Logout Buttons */}
        {isLoggedIn ? (
          <button className="logout-btn"
            onClick={() => {
              sessionStorage.removeItem("authToken");
              setIsLoggedIn(false);
              navigate("/login");
            }}
          >
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
    </header>
  );
};

export default Header;
