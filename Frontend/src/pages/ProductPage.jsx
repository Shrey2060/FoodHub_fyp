import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import FoodCard from "../components/FoodCard/FoodCard";
import "./ProductPage.css";
import { Link } from "react-router-dom";

const ProductPage = () => {
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("authToken"));
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper function to format currency in Nepali Rupees
  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Fetch products from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        
        // Group products by category
        const groupedProducts = response.data.products.reduce((acc, product) => {
          const category = product.category_name || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.image_url,
            price: product.price
          });
          return acc;
        }, {});

        setProducts(groupedProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      // Validate product data before sending
      if (!product.id || !product.price || !product.name) {
        console.error('Invalid product data:', product);
        setPopupMessage('Invalid product data. Please try again.');
        return;
      }

      // Format the cart data to match the backend expectations
      const cartData = {
        product_id: parseInt(product.id),
        quantity: 1,
        price: parseFloat(product.price),
        name: product.name,
        description: product.description || "",
        image_url: product.imageUrl || ""
      };

      console.log("Sending cart data:", cartData);

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

      console.log("Cart response:", response.data);

      if (response.data.success) {
        setPopupMessage(`${product.name} has been added to your cart!`);
        
        // Navigate to cart with the new product data
        navigate("/cart", { 
          state: { 
            addedProduct: {
              cart_item_id: response.data.cartItemId,
              product_id: parseInt(product.id),
              name: product.name,
              description: product.description || "",
              image_url: product.imageUrl || "",
              price: parseFloat(product.price),
              quantity: 1
            }
          }
        });
      } else {
        throw new Error(response.data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding item to cart:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        sessionStorage.removeItem("authToken");
        setIsLoggedIn(false);
        navigate("/login");
        return;
      }

      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error ||
                         error.message || 
                         "An error occurred while adding the item to your cart.";
      
      setPopupMessage(errorMessage);
      console.error("Full error details:", {
        error,
        cartData: error.config?.data,
        headers: error.config?.headers
      });
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
        delivery_address: "Inaruwa",
        contact_number: "9876543210",
        payment_method: "cash"
      };

      console.log("Sending order data:", orderData);

      const response = await axios.post(
        "http://localhost:5000/api/orders/create",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      console.log("Order creation response:", response.data);

      if (response.data.success) {
        setPopupMessage(`${product.name} ordered successfully!`);
        navigate("/orders");
      } else {
        setPopupMessage(response.data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error.response || error);
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
        <div className="product-page">
          <div className="loading">Loading products...</div>
        </div>
      </>
    );
  }

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
                        price={formatCurrency(product.price)}
                      />
                      <div className="product-actions">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="add-to-cart-btn"
                        >
                          Add to Cart
                        </button>

                        <button 
                          onClick={() => handleOrderNow(product)}
                          className="add-to-cart-btn"
                        >
                          Order Now
                        </button>
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
    </>
  );
};

export default ProductPage;
