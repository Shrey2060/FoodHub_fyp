import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css";


const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  useEffect(() => {
    // Validate token on component mount
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      await axios.get(`http://localhost:5000/api/auth/validate-reset-token/${token}`);
    } catch (error) {
      setError("Invalid or expired reset token. Please request a new password reset.");
      setShowErrorModal(true);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        setPasswordStrength("weak");
        break;
      case 2:
      case 3:
        setPasswordStrength("medium");
        break;
      case 4:
        setPasswordStrength("strong");
        break;
      default:
        setPasswordStrength("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Password validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number.");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      setError("Password must contain at least one special character (!@#$%^&*).");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        setMessage("Password reset successful! You can now login with your new password.");
        setShowSuccessModal(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.message);
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
      console.error("Error during password reset:", error);
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-fullpage">
      <div className="reset-password-form">
        <h2 className="reset-password-title">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              required
              minLength="8"
            />
            <div className="password-requirements">
              Password must contain:
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>
            {passwordStrength && (
              <div className={`password-strength strength-${passwordStrength}`}>
                Password Strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </div>
            )}
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="reset-password-btn"
            disabled={loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Password Reset Successful!</h3>
            <p>{message}</p>
            <div className="modal-buttons">
              <button
                className="modal-btn"
                onClick={() => navigate("/login")} // Navigate to login page
              >
                Go to Login
              </button>
              <button
                className="modal-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal-content error-modal">
            <h3>Request Failed!</h3>
            <p>{error}</p>
            <button
              className="modal-btn error-btn"
              onClick={() => setShowErrorModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
