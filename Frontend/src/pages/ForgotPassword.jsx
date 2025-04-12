import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
  
    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
  
      if (response.data.success) {
        setMessage(response.data.message);
        setShowSuccessModal(true);
        setEmail(""); // Clear email after successful submission
      } else {
        setError(response.data.message);
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again later.";
      console.error("Error during forgot password request:", error.message);
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="forgot-password-fullpage">
      <div className="forgot-password-form">
        <h2 className="forgot-password-title">Forgot Password</h2>
        <p>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="forgot-password-btn"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Email Sent!</h3>
            <p>{message}</p>
            <button
              className="modal-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
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

export default ForgotPassword;