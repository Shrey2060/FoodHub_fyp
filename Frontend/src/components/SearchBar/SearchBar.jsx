import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Fetch all products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        const products = response.data.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category_name,
          price: product.price,
          imageUrl: product.image_url
        }));
        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setIsLoading(true);
      try {
        // Filter products based on search query
        const searchResults = allProducts.filter(product => {
          const searchLower = query.toLowerCase();
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower)
          );
        });

        // Group results by match type for better relevance
        const exactMatches = [];
        const nameMatches = [];
        const otherMatches = [];

        searchResults.forEach(product => {
          if (product.name.toLowerCase() === query.toLowerCase()) {
            exactMatches.push(product);
          } else if (product.name.toLowerCase().includes(query.toLowerCase())) {
            nameMatches.push(product);
          } else {
            otherMatches.push(product);
          }
        });

        // Combine results in order of relevance
        setSuggestions([...exactMatches, ...nameMatches, ...otherMatches]);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/search-results", {
        state: {
          searchTerm: searchQuery,
          results: suggestions
        }
      });
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  const handleSelectItem = (item) => {
    navigate(`/food-details/${item.id}`);
    setSearchQuery("");
    setSuggestions([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for food items..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            <FaSearch />
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="suggestions-container">
          {suggestions.map((item) => (
            <div
              key={item.id}
              className="suggestion-item"
              onClick={() => handleSelectItem(item)}
            >
              <div className="suggestion-content">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="suggestion-image"
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <div className="suggestion-details">
                  <h4>{item.name}</h4>
                  <p className="suggestion-category">{item.category}</p>
                  <p className="suggestion-price">Rs. {item.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;