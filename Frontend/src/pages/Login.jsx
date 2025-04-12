import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const userRole = sessionStorage.getItem("userRole");

    // Only navigate if token and role are both present
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

        // Save data to sessionStorage
        sessionStorage.setItem("authToken", accessToken);
        sessionStorage.setItem("userRole", user.role);
        sessionStorage.setItem("userId", user.id);
        sessionStorage.setItem("userName", user.name);

        // Set default axios headers for all future requests
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

  return (
    <div className="login-fullpage">
      <div className="login-image">
        <img
          src="/src/assets/images/Burger.jpg"
          alt="Burger Banner"
          loading="lazy"
        />
      </div>
      <div className="login-form">
        <h2 className="login-title">SIGN IN TO YOUR ACCOUNT</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoComplete="email"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoComplete="current-password"
              className="form-input"
            />
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="sign-in-btn"
              disabled={isLoading}
            >
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>
            <button
              type="button"
              className="forgot-btn"
              onClick={() => navigate("/forgot-password")}
              disabled={isLoading}
            >
              FORGOT PASSWORD
            </button>
          </div>
        </form>
        <p className="signup-text">
          Don't have an account?{" "}
          <Link to="/register" className="signup-link">
            Sign up Here
          </Link>
        </p>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <h3>Login Successful!</h3>
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
  );
};

export default Login;
