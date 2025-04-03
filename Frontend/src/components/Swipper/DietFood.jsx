import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FoodCard from "../FoodCard/FoodCard";
import SearchBar from "../SearchBar";
import pork from "../../assets/images/pork.png";
import right from "../../assets/images/ArrowRight.png";
import left from "../../assets/images/ArrowLeft.png";
import "./Swipper.css";
import Subscription from "../Subscription/Subscription";

const foodItems = [
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Keto" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Keto" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Keto" },
  { img: pork, recipeName: "Pork Satay, Grilled Pork", description: "Grilled pork with rice and veggies.", price: "560", category: "Keto" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Vegan" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Vegan" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Vegan" },
  { img: pork, recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "520", category: "Vegan" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Vegetarian" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Vegetarian" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Vegetarian" },
  { img: pork, recipeName: "Vegetarian Special", description: "Healthy vegetarian food.", price: "530", category: "Vegetarian" },
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


const DietFood = () => {
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
    <>
    <div className="diet-section">
      <div className="search-bar">
        <SearchBar />
      </div>

      <div className="diet-types">
        <h1>
          Diet <span>Types</span>
        </h1>
      </div>

      <div className="btn-bar">
        {["All", "Vegan", "Vegetarian", "Keto"].map((category) => (
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
            <FoodCard key={index} img={item.img} recipeName={item.recipeName} description={item.description} price={item.price} />
          ))}
        </Slider>
      </div>
    </div>
    <Subscription />
    </>
  );
};

export default DietFood;
