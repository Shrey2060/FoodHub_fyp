import React from "react";
import { useParams, Link } from "react-router-dom";
import pizzaImage from "../assets/images/pizza.jpg";
import pastaImage from "../assets/images/pasta.jpg";
import saladImage from "../assets/images/salad.jpg";

const FoodDetails = () => { 
  const { id } = useParams();

  const dishes = [
    {
      id: 1,
      name: "Gourmet Pizza",
      description: "A delicious pizza topped with fresh basil, mozzarella, and a rich tomato sauce. Perfect for a delightful evening with friends and family.",
      ingredients: "Tomato Sauce, Mozzarella Cheese, Fresh Basil, Dough, Pepperoni",
      price: "$12.99",
      image_url: pizzaImage,
    },
    {
      id: 2,
      name: "Creamy Pasta",
      description: "Indulge in our creamy pasta with a sprinkle of parmesan cheese and a dash of fresh herbs.",
      ingredients: "Pasta, Cream, Parmesan Cheese, Basil, Garlic",
      price: "$10.99",
      image_url: pastaImage,
    },
    {
      id: 3,
      name: "Fruit Salad",
      description: "Refresh yourself with our mixed fruit salad, garnished with mint leaves. A perfect healthy treat.",
      ingredients: "Mixed Fruits, Mint Leaves, Honey, Lemon Juice",
      price: "$8.99",
      image_url: saladImage,
    },
  ];

  const dish = dishes.find((item) => item.id === parseInt(id));

  if (!dish) {
    return <h1>Dish not found!</h1>;
  }

  return (
    <div className="food-details-container">
      <div className="food-details-image">
        <img src={dish.image_url} alt={dish.name} />
      </div>
      <div className="food-details-content">
        <h1>{dish.name}</h1>
        <p className="description">{dish.description}</p>
        <h3>Ingredients:</h3>
        <p>{dish.ingredients}</p>
        <h3>Price:</h3>
        <p>{dish.price}</p>
        <Link to="/home" className="back-button">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default FoodDetails;
