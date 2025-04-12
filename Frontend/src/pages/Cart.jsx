import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import { toast } from "react-toastify";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [checkoutForm, setCheckoutForm] = useState({
    delivery_address: "",
    contact_number: "",
    payment_method: "cash"
  });

  // Add state for order confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Helper function to format currency in Nepali Rupees
  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const fetchCartItems = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("Please log in to view your cart");
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        let items = response.data.cartItems || [];

        // If new product passed from another page, merge it
        if (location.state?.addedProduct) {
          const newProduct = location.state.addedProduct;
          const existingItemIndex = items.findIndex(item => 
            item.product_id === newProduct.product_id
          );

          if (existingItemIndex >= 0) {
            items[existingItemIndex].quantity += newProduct.quantity;
          } else {
            items.push(newProduct);
          }

          // Clear the location state
          window.history.replaceState({}, document.title);
        }

        setCartItems(items);
        calculateTotals(items);
      } else {
        setError("Failed to fetch cart items");
      }
    } catch (err) {
      console.error("Error fetching cart items:", err);
      if (err.response?.status === 401) {
        sessionStorage.removeItem("authToken");
        navigate("/login");
        return;
      }
      setError("An error occurred while fetching your cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [location]);

  const calculateTotals = (items) => {
    const newSubtotal = items.reduce((acc, item) => {
      return acc + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);

    const newTax = newSubtotal * 0.13; // 13% VAT
    const newTotal = newSubtotal + newTax;

    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        const updatedItems = cartItems.map(item =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        );
        setCartItems(updatedItems);
        calculateTotals(updatedItems);
      } else {
        toast.error("Failed to update quantity");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/cart/${cartItemId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        const updatedCart = cartItems.filter(
          (item) => item.cart_item_id !== cartItemId
        );
        setCartItems(updatedCart);
        calculateTotals(updatedCart);
        toast.success("Item removed from cart");
      } else {
        toast.error("Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProceedToCheckout = () => {
    if (!checkoutForm.delivery_address || !checkoutForm.contact_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    setOrderDetails({
      items: cartItems,
      total_amount: total,
      ...checkoutForm
    });
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    try {
      const orderResponse = await axios.post(
        "http://localhost:5000/api/orders/create",
        {
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: parseFloat(item.price)
          })),
          total_amount: total,
          status: 'pending',
          ...checkoutForm
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (orderResponse.data.success) {
        // Clear the cart
        await axios.delete("http://localhost:5000/api/cart", {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        });

        toast.success("Order placed successfully!");
        navigate("/orders");
      } else {
        toast.error("Failed to place order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to process your order");
    } finally {
      setShowConfirmation(false);
    }
  };

  const OrderConfirmationDialog = () => {
    if (!showConfirmation || !orderDetails) return null;

    return (
      <div className="confirmation-dialog-overlay">
        <div className="confirmation-dialog">
          <h2>Confirm Your Order</h2>
          
          <div className="confirmation-content">
            <div className="order-items-summary">
              <h3>Order Items:</h3>
              {orderDetails.items.map((item, index) => (
                <div key={index} className="confirmation-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="order-details-summary">
              <h3>Delivery Details:</h3>
              <p><strong>Address:</strong> {orderDetails.delivery_address}</p>
              <p><strong>Contact:</strong> {orderDetails.contact_number}</p>
              <p><strong>Payment Method:</strong> {orderDetails.payment_method}</p>
            </div>

            <div className="order-total-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (13%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <button 
              className="btn-cancel"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-confirm"
              onClick={confirmOrder}
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="cart-container">
          <div className="loading">Loading your cart...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="cart-container">
        <section className="cart-content">
          <h2 className="cart-title">Your Cart</h2>

          {error && <p className="cart-error">{error}</p>}

          {cartItems.length === 0 && !error ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.cart_item_id} className="cart-item">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="cart-item-image"
                    />
                    <div className="cart-item-details">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="cart-item-quantity">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.cart_item_id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>Qty: {item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.cart_item_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-price">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-item">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="cart-summary-item">
                  <span>VAT (13%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="cart-summary-item total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div className="checkout-form">
                  <h3>Checkout Information</h3>
                  <div className="form-group">
                    <label htmlFor="delivery_address">Delivery Address</label>
                    <input
                      type="text"
                      id="delivery_address"
                      name="delivery_address"
                      value={checkoutForm.delivery_address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact_number">Contact Number</label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      value={checkoutForm.contact_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="payment_method">Payment Method</label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={checkoutForm.payment_method}
                      onChange={handleInputChange}
                    >
                      <option value="cash">Cash on Delivery</option>
                      <option value="card">Khalti Payment</option>
                    </select>
                  </div>
                </div>

                <button
                  className="checkout-button"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <OrderConfirmationDialog />
    </>
  );
};

export default Cart;
