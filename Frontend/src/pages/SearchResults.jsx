import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import FoodCard from '../components/FoodCard/FoodCard';
import './SearchResults.css';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState(null);
  const [isLoggedIn] = useState(!!sessionStorage.getItem('authToken'));
  
  // Get search results from location state
  const { searchTerm, results } = location.state || { searchTerm: '', results: [] };

  // Helper function to format currency in Nepali Rupees
  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/cart',
        {
          product_id: product.id,
          quantity: 1,
          price: product.price,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setPopupMessage(`${product.name} has been added to your cart!`);
      } else {
        setPopupMessage(response.data.message || 'Failed to add item to cart.');
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setPopupMessage('An error occurred while adding the item to your cart.');
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };

  const handleOrderNow = async (product) => {
    if (!isLoggedIn) {
      navigate('/login');
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
        delivery_address: 'Inaruwa',
        contact_number: '9876543210',
        payment_method: 'cash'
      };

      const response = await axios.post(
        'http://localhost:5000/api/orders/create',
        orderData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setPopupMessage(`${product.name} ordered successfully!`);
        navigate('/orders');
      } else {
        setPopupMessage(response.data.message || 'Failed to place order.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setPopupMessage(
        error.response?.data?.message || 
        'An error occurred while placing the order. Please try again.'
      );
    }

    setTimeout(() => setPopupMessage(null), 3000);
  };

  return (
    <div className="search-results-container">
      <Header />
      {popupMessage && (
        <div className="popup-message">
          {popupMessage}
        </div>
      )}
      <div className="search-results-content">
        <h2>Search Results for "{searchTerm}"</h2>
        {results.length === 0 ? (
          <div className="no-results">
            <p>No products found matching your search.</p>
            <button onClick={() => navigate('/products')} className="browse-all-btn">
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="search-results-grid">
            {results.map((product) => (
              <div key={product.id} className="product-card">
                <FoodCard
                  img={product.imageUrl}
                  recipeName={product.name}
                  description={product.description || 'No description available'}
                  price={formatCurrency(product.price)}
                  category={product.category}
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
                    className="order-now-btn"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults; 