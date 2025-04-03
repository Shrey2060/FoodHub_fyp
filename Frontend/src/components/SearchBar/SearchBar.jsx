import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setIsLoading(true);
      try {
        console.log('Sending search request for:', query); // Debug log
        const response = await axios.get(`http://localhost:5000/api/search?query=${query}`);
        console.log('Search response:', response.data); // Debug log
        
        if (response.data.success) {
          setSuggestions(response.data.items);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectItem = (item) => {
    setSearchQuery(item.name);
    setSuggestions([]);
    navigate(`/food-details/${item.id}`);
  };

  // Close suggestions when clicking outside
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
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, category, or keywords..."
          className="search-input"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {isLoading ? (
            <div className="loading">Searching...</div>
          ) : (
            <ul>
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="suggestion-item"
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="suggestion-image"
                    onError={(e) => e.target.src = '/images/default-food.jpg'}
                  />
                  <div className="suggestion-details">
                    <span className="suggestion-name">{item.name}</span>
                    <span className="suggestion-price">${item.price}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;