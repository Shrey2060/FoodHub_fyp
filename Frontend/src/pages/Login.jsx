import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const userRole = sessionStorage.getItem("userRole");

    if (token && userRole) {
      if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", formData);

      if (response.data.success) {
        const { accessToken, user } = response.data;

        sessionStorage.setItem("authToken", accessToken);
        sessionStorage.setItem("userRole", user.role);
        sessionStorage.setItem("userId", user.id);
        sessionStorage.setItem("userName", user.name);

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        setMessage("Login successful!");
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          if (user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        }, 1500);
      } else {
        setErrors("Login failed. Please check your credentials.");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors(error.response?.data?.message || "Invalid email or password. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrors("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <img src="/src/assets/images/logo.png" alt="FoodHUB Logo" className="login-logo" />
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in to continue to FoodHUB</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="email"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="form-input"
              />
              <div
                className="password-toggle"
                onClick={togglePasswordVisibility}
                role="button"
                tabIndex={0}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className={`sign-in-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              className="forgot-btn"
              onClick={() => navigate("/forgot-password")}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <p className="signup-text">
          Don't have an account?{" "}
          <Link to="/register" className="signup-link">
            Create Account
          </Link>
        </p>

        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content success-modal">
              <h3>Welcome Back!</h3>
              <p>{message}</p>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="modal-overlay">
            <div className="modal-content error-modal">
              <h3>Login Failed</h3>
              <p>{errors}</p>
              <button className="modal-btn error-btn" onClick={closeErrorModal}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
