import React, { useState, useEffect } from 'react';
import FoodCard from "../FoodCard/FoodCard";
import "./FoodBundles.css"
import Burger from "../../assets/images/Burger.jpg";
import Chalamari from "../../assets/images/Calamari.jpg";
import chicken from "../../assets/images/chicken.avif";
import pasta from "../../assets/images/pasta.jpg";
import Header from '../Header';
import axios from 'axios';

const FoodBundles = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [showExperience, setShowExperience] = useState(false);
    const [currentExperience, setCurrentExperience] = useState(null);

    const fetchBundles = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/bundles');
            if (response.data.success) {
                setBundles(response.data.bundles);
            }
        } catch (error) {
            console.error('Error fetching bundles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBundles();
    }, []);

    const startExperience = async (bundleId, experienceType) => {
        try {
            const response = await axios.post(`http://localhost:5000/api/bundles/${bundleId}/start-experience`, {
                experienceType
            });
            if (response.data.success) {
                setCurrentExperience({
                    type: experienceType,
                    data: response.data.experienceData
                });
                setShowExperience(true);
            }
        } catch (error) {
            console.error('Error starting experience:', error);
        }
    };

    const ExperienceModal = ({ experience, onClose }) => {
        if (!experience) return null;

        return (
            <div className="experience-modal">
                <div className="experience-content">
                    <button className="close-btn" onClick={onClose}>×</button>
                    <h2>{experience.data.title}</h2>
                    {experience.type === 'trivia' && (
                        <div className="trivia-content">
                            {experience.data.questions.map((q, i) => (
                                <div key={i} className="question">
                                    <h3>{q.question}</h3>
                                    <div className="options">
                                        {q.options?.map((option, j) => (
                                            <button key={j} className="option-btn">{option}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {experience.type === 'recipe_challenge' && (
                        <div className="recipe-content">
                            <p>{experience.data.description}</p>
                            <p>Difficulty: {experience.data.difficulty}</p>
                            <p>Time: {experience.data.estimatedTime}</p>
                            <div className="steps">
                                {experience.data.steps?.map((step, i) => (
                                    <div key={i} className="step">{step}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {experience.type === 'cultural_playlist' && (
                        <div className="playlist-content">
                            <p>{experience.data.description}</p>
                            <div className="genres">
                                {experience.data.genres?.map((genre, i) => (
                                    <span key={i} className="genre-tag">{genre}</span>
                                ))}
                            </div>
                            <p>Duration: {experience.data.duration}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                    <p className="subtitle">Discover our specially curated food bundles with interactive experiences</p>

                    <div className="bundles-grid">
                        {bundles.map(bundle => (
                            <div key={bundle.id} className="bundle-card-container">
                                <FoodCard 
                                    img={bundle.image_url} 
                                    recipeName={bundle.name} 
                                    description={bundle.description} 
                                    price={Math.floor(bundle.price * (1 - bundle.discount_percentage / 100))} 
                                />
                                <div className="experience-buttons">
                                    <button 
                                        className="experience-btn trivia"
                                        onClick={() => startExperience(bundle.id, 'trivia')}
                                    >
                                        Start Trivia
                                    </button>
                                    <button 
                                        className="experience-btn recipe"
                                        onClick={() => startExperience(bundle.id, 'recipe_challenge')}
                                    >
                                        Recipe Challenge
                                    </button>
                                    <button 
                                        className="experience-btn playlist"
                                        onClick={() => startExperience(bundle.id, 'cultural_playlist')}
                                    >
                                        Cultural Playlist
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
        {showExperience && (
            <ExperienceModal 
                experience={currentExperience}
                onClose={() => {
                    setShowExperience(false);
                    setCurrentExperience(null);
                }}
            />
        )}
        </>
    );
};
export default FoodBundles;
