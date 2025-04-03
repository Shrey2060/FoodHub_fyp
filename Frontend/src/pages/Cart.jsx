import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Footer from "../components/Footer/Footer";
import Header from "../components/Header";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        });

        if (response.data.success) {
          let items = response.data.cartItems;

          // If new product passed from another page, merge it
          if (location.state?.product) {
            items = [...items, location.state.product];
          }

          setCartItems(items);
          calculateTotals(items);
        } else {
          setError("Failed to fetch cart items. Please try again later.");
        }
      } catch (err) {
        console.error("Error fetching cart items:", err.message);
        setError("An error occurred while fetching cart items.");
      }
    };

    fetchCartItems();
  }, [location]);

  const calculateTotals = (items) => {
    const newSubtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const newTax = newSubtotal * 0.08;
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax);
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
      } else {
        setError("Failed to remove the item. Please try again.");
      }
    } catch (err) {
      console.error("Error removing item:", err.message);
      setError("An error occurred while removing the item.");
    }
  };

  const handleProceedToCheckout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/orders/place",
        {
          cartItems,
          total,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Order placed successfully!");
        navigate("/order-history");
      } else {
        setError("Failed to place the order. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err.message);
      setError("Failed to process your order. Please try again.");
    }
  };

  return (
    <>
      <Header />

      <section className="cart-content">
        <h2 className="cart-title">Your Cart</h2>

        {error && <p className="cart-error">{error}</p>}

        {cartItems.length === 0 && !error ? (
          <p className="empty-cart">Your cart is empty.</p>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div key={item.cart_item_id || index} className="cart-item">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.product_name || item.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h3>{item.product_name || item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="cart-item-quantity">Qty: {item.quantity}</div>
                  <div className="cart-item-price">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </div>
                  {item.cart_item_id && (
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-summary-item">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-item">
                <span>Tax (8%)</span>
                <span>Rs. {tax.toFixed(2)}</span>
              </div>
              <div className="cart-summary-item total">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
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

      <Footer />
    </>
  );
};

export default Cart;
