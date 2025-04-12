import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../data/products";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const allProducts = getAllProducts();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchingProducts = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower)
    ).map(product => ({
      type: "product",
      ...product
    }));

    setSuggestions(matchingProducts);
  }, [searchTerm]);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.name);
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search for dishes or categories..."
          className="search-input"
        />
        <button 
          className="search-button"
          onClick={() => handleSearch(searchTerm)}
        >
          Search
        </button>
      </div>

      {showSuggestions && (
        <div className="suggestions-container">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-icon">🍽️</span>
                  <span className="suggestion-text">{suggestion.name}</span>
                  <span className="suggestion-category">{suggestion.category}</span>
                </div>
              ))}
            </>
          ) : searchTerm ? (
            <div className="no-suggestions">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;