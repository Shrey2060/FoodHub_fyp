import React, { useState, useEffect } from "react";
import axios from "axios";

const dietaryOptions = ["vegan", "gluten-free", "nut-free", "vegetarian"];

const FoodFilter = ({ setFilteredFood }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const fetchFilteredFood = async () => {
    try {
      let query = selectedFilters.join(",");
      const response = await axios.get(`http://localhost:5000/api/food-items?diet=${query}`);
      setFilteredFood(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFilteredFood();
  }, [selectedFilters]);

  return (
    <div>
      <h3>Filter by Diet:</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {dietaryOptions.map((option) => (
          <button
            key={option}
            onClick={() => toggleFilter(option)}
            style={{
              backgroundColor: selectedFilters.includes(option) ? "green" : "gray",
              color: "white",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
              border: "none",
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <h3>Filtered Food Items:</h3>
      <ul>
        {setFilteredFood.length > 0 ? (
          setFilteredFood.map((food) => <li key={food.id}>{food.name}</li>)
        ) : (
          <li>No food items match the selected filters.</li>
        )}
      </ul>
    </div>
  );
};

export default FoodFilter;
