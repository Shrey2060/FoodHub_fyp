import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import FoodCard from "../components/FoodCard/FoodCard";
import "./ProductPage.css";
import Footer from "../components/Footer/Footer";
import { Link } from "react-router-dom";

const ProductPage = () => {
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("authToken"));

  const products = {
    "Starters": [
      { id: 1, name: "Bruschetta", description: "Crispy bread...", imageUrl: "/src/assets/images/Bruschetta.jpg", price: 8.99 },
      { id: 2, name: "Hummus", description: "Smooth chickpea dip...", imageUrl: "/src/assets/images/Hummus.jpg", price: 6.99 },
      { id: 3, name: "Calamari", description: "Tender calamari rings...", imageUrl: "/src/assets/images/Calamari.jpg", price: 10.99 },
    ],
    "Main Course": [
      { id: 4, name: "Grilled Steak", description: "Perfectly grilled steak...", imageUrl: "/src/assets/images/Grilled Steak.jpg", price: 24.99 },
      { id: 5, name: "Chicken Alfredo", description: "Creamy Alfredo sauce...", imageUrl: "/src/assets/images/Chicken Alfredo.jpg", price: 18.99 },
      { id: 6, name: "Vegetable Stir-fry", description: "Seasonal vegetables stir-fried...", imageUrl: "/src/assets/images/Vegetable Stir-fry.jpg", price: 15.99 },
    ],
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/cart",
        {
          product_id: product.id,
          quantity: 1,
          price: product.price,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        setPopupMessage(`${product.name} has been added to your cart!`);
      } else {
        setPopupMessage(response.data.message || "Failed to add item to cart.");
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setPopupMessage("An error occurred while adding the item to your cart.");
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleOrderNow = async (product) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const orderData = {
        items: [
          {
            product_id: product.id,
            quantity: 1,
            price: product.price
          }
        ],
        total_amount: product.price,
        delivery_address: "Default Address", // You can make this dynamic later
        contact_number: "0000000000",         // Replace with actual user input or profile data
        payment_method: "cash"                // Can be 'cash' or 'online', etc.
      };

      const response = await axios.post(
        "http://localhost:5000/api/orders/create",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.success) {
        setPopupMessage(`${product.name} ordered successfully!`);
        setTimeout(() => navigate("/orders"), 2000);
      } else {
        setPopupMessage(response.data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setPopupMessage("An error occurred while placing the order.");
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };


  return (
    <>
      <Header />
      <div className="product-page">
        <div className="product-content">
          <main>
            {Object.keys(products).map((category) => (
              <section key={category} className="product-section">
                <h2 className="text-3xl font-bold mb-6 text-orange-600">{category}</h2>
                <div className="product-grid">
                  {products[category].map((product) => (
                    <div key={product.id} className="product-card">
                      <FoodCard
                        img={product.imageUrl}
                        recipeName={product.name}
                        description={product.description}
                        price={product.price}
                      />
                      <div className="product-actions">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="add-to-cart-btn"
                        >
                          Add to Cart
                        </button>

                        <Link to="/orders">
                          <button className="add-to-cart-btn" onClick={handleOrderNow}>Order Now</button>
                        </Link>

                      </div>

                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>

          {popupMessage && (
            <div className="popup-overlay">
              <div className="popup-container">
                <p>{popupMessage}</p>
                <button
                  onClick={() => setPopupMessage(null)}
                  className="popup-button"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductPage;
