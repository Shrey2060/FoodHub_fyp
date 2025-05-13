import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FoodCard from "../FoodCard/FoodCard";
import SearchBar from "../SearchBar/SearchBar";
import pork from "../../assets/images/pork.png";
import right from "../../assets/images/ArrowRight.png";
import left from "../../assets/images/ArrowLeft.png";
import "./Swipper.css";

const foodItems = [
  { img: "https://www.theroastedroot.net/wp-content/uploads/2021/01/cabbage-stir-fry-1.jpg", recipeName: "Cabbage Stir Fry", description: "Cabbage with veggies.", price: "", category: "Keto" },
  { img: "https://www.ruled.me/wp-content/uploads/2021/11/One-Pan-Keto-Chicken-and-Spinach-Featured.jpg", recipeName: "One Pan Keto Chicken and Spinach", description: "Chicken and Spinach", price: "", category: "Keto" },
  { img: "https://mylifecookbook.com/wp-content/uploads/2022/01/breakfast-bowl-SQ2.jpg", recipeName: "Breakfast Bowl", description: " Breakfast Bowl", price: "", category: "Keto" },
  { img: "https://ketodietapp.com/Blog/lchf-soc/5-ingredient-keto-salad-9157373F.jpg", recipeName: "Ingredient Keto Salad", description: "Keto Salad", price: "", category: "Keto" },
  { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuRNzMy44D3IF313JOKXKukXVGEjfJTl20yA&s", recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "", category: "Vegan" },
  { img: "https://b3fcdc12.delivery.rocketcdn.me/wp-content/uploads/2022/08/raw-vegan-taco-salad-1-e1660755729262.jpg", recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "", category: "Vegan" },
  { img: "https://www.sunglowkitchen.com/wp-content/uploads/2021/06/vegan-stir-fry-recipe-10.jpg", recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "", category: "Vegan" },
  { img: "https://www.makingthymeforhealth.com/wp-content/uploads/2018/01/One-Pot-Spanish-Quinoa-_-700x1050.jpg", recipeName: "Vegan Delight", description: "Delicious vegan meal.", price: "", category: "Vegan" },
  { img: "https://vikalinka.com/wp-content/uploads/2023/11/Easy-Chicken-Curry-13-Edit.jpg", recipeName: "Chicken Curry", description: "Tasty", price: "530", category: "Non Veg" },
  { img: "https://static.toiimg.com/thumb/msid-111281810,width-1280,height-720,imgsize-137264,resizemode-6,overlay-toi_sw,pt-32,y_pad-40/photo.jpg", recipeName: "Chicken Roast", description: "Too good", price: "530", category: "Non Veg" },
  { img: "https://thecookingfoodie.com/wp-content/uploads/2024/08/240911_d1-jpg.jpg", recipeName: "Chicken Sandwich", description: "So tasty.", price: "530", category: "Non Veg" },
  { img: "https://www.wholesomeyum.com/wp-content/uploads/2022/12/wholesomeyum-Baked-Whole-Chicken-Wings-15.jpg", recipeName: "Chicken Wings", description: "Best Dish.", price: "530", category: "Non Veg" },
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
        {["All", "Vegan", "Non Veg", "Keto"].map((category) => (
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
            <FoodCard key={index} img={item.img} recipeName={item.recipeName} description={item.description} />
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default DietFood;
