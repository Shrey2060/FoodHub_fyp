import React from "react";
import "./FoodCard.css";

const FoodCard = ({img, recipeName, description, price}) => {
  return (
    <div className="food-card">
      <img src={img} alt="Pork Satay" className="food-image" />
      
      <div className="food-info">
        <h3 className="food-title">{recipeName}</h3>
        <p className="food-description">
          {description}
        </p>
      </div>

      <div className="food-footer">
        <h2 className="food-price">Rs. {price}</h2>
      </div>
    </div>
  );
};

export default FoodCard;
