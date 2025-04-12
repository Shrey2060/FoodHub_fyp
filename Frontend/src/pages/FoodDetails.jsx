import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import "./FoodDetails.css";

const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("authToken"));

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        const products = response.data.products;
        const foundProduct = products.find(product => product.id === parseInt(id));
        
        if (foundProduct) {
          setFood({
            id: foundProduct.id,
            name: foundProduct.name,
            description: foundProduct.description,
            category_name: foundProduct.category_name,
            price: foundProduct.price,
            image_url: foundProduct.image_url
          });
        } else {
          setError("Food item not found");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching food details:", error);
        setError("Failed to load food details. Please try again later.");
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const cartData = {
        product_id: parseInt(food.id),
        quantity: 1,
        price: parseFloat(food.price),
        name: food.name,
        description: food.description || "",
        image_url: food.image_url || ""
      };

      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setPopupMessage("Please log in to add items to cart");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/cart",
        cartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.success) {
        setPopupMessage(`${food.name} has been added to your cart!`);
        navigate("/cart", { 
          state: { 
            addedProduct: {
              cart_item_id: response.data.cartItemId,
              product_id: parseInt(food.id),
              name: food.name,
              description: food.description || "",
              image_url: food.image_url || "",
              price: parseFloat(food.price),
              quantity: 1
            }
          }
        });
      } else {
        throw new Error(response.data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setPopupMessage(error.response?.data?.message || "Failed to add item to cart");
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };

  const handleOrderNow = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const orderData = {
        items: [
          {
            product_id: food.id,
            quantity: 1,
            price: food.price
          }
        ],
        total_amount: food.price,
        delivery_address: "Inaruwa",
        contact_number: "9876543210",
        payment_method: "cash"
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
        setPopupMessage(`${food.name} ordered successfully!`);
        navigate("/orders");
      } else {
        setPopupMessage(response.data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setPopupMessage(
        error.response?.data?.message || 
        "An error occurred while placing the order. Please try again."
      );
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading food details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </>
    );
  }

  if (!food) {
    return (
      <>
        <Header />
        <div className="not-found-container">
          <h1>Food item not found!</h1>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="food-details-container">
        <div className="food-details-content">
          <div className="food-details-header">
            <h1>{food.name}</h1>
            <div className="food-price">{formatCurrency(food.price)}</div>
          </div>

          <div className="food-details-image">
            <img 
              src={food.image_url} 
              alt={food.name}
              onError={(e) => {
                e.target.src = '/placeholder.jpg';
              }}
            />
          </div>

          <div className="food-details-info">
            <div className="food-description">
              <h3>Description</h3>
              <p>{food.description}</p>
            </div>

            <div className="food-category">
              <h3>Category</h3>
              <p>{food.category_name}</p>
            </div>

            <div className="food-actions">
              <button onClick={handleAddToCart} className="add-to-cart-btn">
                Add to Cart
              </button>
              <button onClick={handleOrderNow} className="add-to-cart-btn">
                Order Now
              </button>
              <Link to="/" className="back-link">Back to Menu</Link>
            </div>
          </div>
        </div>

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
    </>
  );
};

export default FoodDetails;
