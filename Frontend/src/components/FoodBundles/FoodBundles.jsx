import React, { useState, useEffect } from 'react';
import FoodCard from "../FoodCard/FoodCard";
import "./FoodBundles.css"
import Burger from "../../assets/images/Burger.jpg";
import Chalamari from "../../assets/images/Calamari.jpg";
import chicken from "../../assets/images/chicken.avif";
import pasta from "../../assets/images/pasta.jpg";
import Header from '../Header';
import Footer from "../Footer/Footer";



const FoodBundles = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);

    const sampleBundles = [
        {
            id: 1,
            name: "Family Feast Bundle",
            description: "Perfect for family gatherings! A complete meal for 4-6 people.",
            price: 1999,
            discount_percentage: 15,
            image_url: pasta,
        },
        {
            id: 2,
            name: "Date Night Special",
            description: "Romantic dinner for two with premium selections.",
            price: 1499,
            discount_percentage: 10,
            image_url: Chalamari,
        },
        {
            id: 3,
            name: "Grilled",
            description: "Nutritious and delicious meals for health-conscious foodies.",
            price: 1599,
            discount_percentage: 15,
            image_url: chicken,
        },
        {
            id: 4,
            name: "Healthy Choice Bundle",
            description: "Nutritious and delicious meals for health-conscious foodies.",
            price: 1299,
            discount_percentage: 20,
            image_url: Burger,
        }
    ];

    useEffect(() => {
        setBundles(sampleBundles);
        setLoading(false);
    }, []);

    if (loading) return <div className="loading-text">Loading...</div>;

    return (
        <>
        <Header />
        <div className="food-bundles-container">
            <div className="overlay">
                <main className="content">
                    <h1 className="title">Food Experience Bundles</h1>
                    <p className="subtitle">Discover our specially curated food bundles</p>

                    <div className="bundles-grid">
                        {bundles.map(bundle => (
                            <FoodCard 
                                key={bundle.id} 
                                img={bundle.image_url} 
                                recipeName={bundle.name} 
                                description={bundle.description} 
                                price={Math.floor(bundle.price * (1 - bundle.discount_percentage / 100))} 
                            />
                        ))}
                    </div>
                </main>
            </div>
        </div>
        <Footer />
        </>
    );
};
export default FoodBundles;
