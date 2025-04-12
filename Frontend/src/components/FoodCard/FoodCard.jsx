import React from "react";
import "./FoodCard.css";

const FoodCard = ({img, recipeName, description, price, category}) => {
  return (
    <div className="food-card">
      <img 
        src={img} 
        alt={recipeName} 
        className="food-image"
        onError={(e) => {
          e.target.src = '/src/assets/images/default-food.jpg';
        }}
      />
      
      <div className="food-info">
        <h3 className="food-name">{recipeName}</h3>
        {category && <span className="food-category">{category}</span>}
        <p className="food-description">
          {description}
        </p>
        <p className="food-price">{price}</p>
      </div>
    </div>
  );
};

export default FoodCard;
