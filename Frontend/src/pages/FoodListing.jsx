import React, { useState, useEffect } from 'react';
import AllergyFilter from './AllergyFilter';
import axios from 'axios';

const FoodListing = () => {
    const [foods, setFoods] = useState([]);

    const handleFilterChange = async (filters) => {
        try {
            const response = await axios.get('/api/filtered-food', {
                params: filters
            });
            setFoods(response.data);
        } catch (error) {
            console.error('Error fetching filtered foods:', error);
        }
    };

    return (
        <div>
            <AllergyFilter onFilterChange={handleFilterChange} />
            <div className="food-grid">
                {foods.map(food => (
                    <div key={food.id} className="food-item">
                        <h3>{food.name}</h3>
                        <p>{food.description}</p>
                        <p>Price: ${food.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FoodListing;