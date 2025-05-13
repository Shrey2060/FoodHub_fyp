import React from "react";
import "./home.css";
import allustration from "../../assets/images/Allustration.png";
import { Link } from "react-router-dom";
import { FaGift } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="home">
      <div className="home-component">
        <div className="desc">
          <h1>
            Happy with <span>delicious</span>
          </h1>
          <span>food</span> <span style={{color: "black"}}>and get new</span>
          <h1>experiences with </h1>
          <h1>FoodHub</h1>
        </div>
        <div className="btn-component">
          <Link to="/products">
            <button
              className={`order ${
                location.pathname === "/products" ? "active" : ""
              }`}
            >
              Order Now 🛒
            </button>
          </Link>

          <Link to="/bundles">
            <button
              className={`items ${
                location.pathname === "/bundles" ? "active" : ""
              }`}
            >
              See items
            </button>
          </Link>

          <Link to="/rewards" className="rewards">
            <FaGift style={{ marginRight: '8px' }} /> Rewards
          </Link>

          <div className="subscribe-row">
            <Link to="/subscribe">
              <button
                className="subscribe"
              >
                Subscribe
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <img src={allustration} alt="Dishes" />
      </div>
    </div>
  );
};

export default Home;
