import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";


const ResetPassword = () => {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate(); // Initialize navigate hook
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setShowSuccessModal(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(response.data.message);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error during password reset:", error);
      setError("An error occurred. Please try again.");
      setShowErrorModal(true);
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
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
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
          <button type="submit" className="reset-password-btn">
            Reset Password
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
