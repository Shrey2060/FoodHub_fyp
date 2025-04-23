import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FoodCard from "../FoodCard/FoodCard";
import pork from "../../assets/images/pork.png";
import right from "../../assets/images/ArrowRight.png";
import left from "../../assets/images/ArrowLeft.png";
import "./Allergies.css";

const foodItems = [
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Gluten-Free" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Gluten-Free" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Gluten-Free" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Gluten-Free" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Nut-Free" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Nut-Free" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Nut-Free" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Nut-Free" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Dairy-Free" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Dairy-Free" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Dairy-Free" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Dairy-Free" },
];

const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <img
      className={`${className} arrow next-arrow`}
      src={right}
      alt="Next"
      onClick={onClick}
      style={{ ...style, display: "block" }}
    />
  );
};

const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <img
      className={`${className} arrow prev-arrow`}
      src={left}
      alt="Previous"
      onClick={onClick}
      style={{ ...style, display: "block" }}
    />
  );
};

const Allergies = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems =
    selectedCategory === "All"
      ? foodItems
      : foodItems.filter((item) => item.category === selectedCategory);

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: Math.min(3, filteredItems.length),
    slidesToScroll: 1,
    autoplay: false,
    pauseOnHover: true,
    swipeToSlide: true,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="allergies-section">
      <div className="allergies-types">
        <h1>Allergies</h1>
      </div>

      <div className="btn-bar">
        {["All", "Gluten-Free", "Nut-Free", "Dairy-Free"].map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="slider-container">
        <Slider {...settings}>
          {filteredItems.map((item, index) => (
            <FoodCard
              key={index}
              img={item.img}
              recipeName={item.recipeName}
              description={item.description}
              price={item.price}
            />
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Allergies;
