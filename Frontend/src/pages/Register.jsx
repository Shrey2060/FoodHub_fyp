"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Register.css"

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "", // Added phone number field
    agreeTerms: false,
  })

  const [errors, setErrors] = useState("")
  const [message, setMessage] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
    setErrors("")
    setMessage("")
  }

  // Function to handle redirection to login page
  const redirectToLogin = () => {
    setShowSuccessModal(false)
    navigate("/login")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic form validation
    if (!formData.name.trim()) {
      setErrors("Please enter your full name.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setErrors("Please enter your email.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    if (!formData.phoneNumber.trim()) {
      setErrors("Please enter your phone number.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    if (!formData.agreeTerms) {
      setErrors("Please agree to the terms and conditions.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors("Passwords do not match.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setErrors("Password must be at least 6 characters long.")
      setShowErrorModal(true)
      setIsLoading(false)
      return
    }

    try {
      // Send registration data to the backend
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber, // Added phone number to the API request
      })

      setIsLoading(false)

      if (response.data && response.data.success) {
        setMessage("Successfully registered! Redirecting to login page...")
        setShowSuccessModal(true)

        // Reset form data
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phoneNumber: "", // Reset phone number field
          agreeTerms: false,
        })

        // Redirect after delay
        setTimeout(() => {
          redirectToLogin()
        }, 3000)
      } else {
        setErrors(response.data?.message || "Registration failed. Please try again.")
        setShowErrorModal(true)
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Error during registration:", error)

      // Handle specific error responses from server
      if (error.response && error.response.data) {
        setErrors(error.response.data.message || "Registration failed. Please try again.")
      } else {
        setErrors("Connection error. Please check your internet connection and try again.")
      }

      setShowErrorModal(true)
    }
  }

  // Close modals if Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSuccessModal(false)
        setShowErrorModal(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="image-container">
          <img src="/src/assets/images/Burger.jpg" alt="Burger" className="burger-image" />
        </div>

        <div className="form-container">
          <div className="form-content">
            <h1 className="form-title">Create Account</h1>
            <p className="form-subtitle">Join our community of food lovers</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Added Phone Number Field */}
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="terms-group">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms">
                  I agree to the{" "}
                  <a href="/terms" className="terms-link">
                    Terms & Conditions
                  </a>
                </label>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              <p className="login-link">
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate("/login")
                  }}
                >
                  Sign in
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal Dialog */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <h3>Registration Successful!</h3>
            <p>{message}</p>
            <button className="modal-btn" onClick={redirectToLogin}>
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* Error Modal Dialog */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal-content error-modal">
            <h3>Registration Failed</h3>
            <p>{errors}</p>
            <button className="modal-btn error-btn" onClick={() => setShowErrorModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register


