import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllergyFilter = ({ onFilterChange }) => {
    const [allergies, setAllergies] = useState([]);
    const [dietaryPreferences, setDietaryPreferences] = useState([]);
    const [selectedAllergies, setSelectedAllergies] = useState([]);
    const [selectedPreferences, setSelectedPreferences] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [allergiesRes, preferencesRes] = await Promise.all([
                    axios.get('/api/allergies'),
                    axios.get('/api/dietary-preferences')
                ]);
                setAllergies(allergiesRes.data);
                setDietaryPreferences(preferencesRes.data);
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };
        fetchFilters();
    }, []);

    const handleAllergyChange = (allergyId) => {
        const newSelected = selectedAllergies.includes(allergyId)
            ? selectedAllergies.filter(id => id !== allergyId)
            : [...selectedAllergies, allergyId];
        
        setSelectedAllergies(newSelected);
        updateFilters(newSelected, selectedPreferences);
    };

    const handlePreferenceChange = (preferenceId) => {
        const newSelected = selectedPreferences.includes(preferenceId)
            ? selectedPreferences.filter(id => id !== preferenceId)
            : [...selectedPreferences, preferenceId];
        
        setSelectedPreferences(newSelected);
        updateFilters(selectedAllergies, newSelected);
    };

    const updateFilters = (allergies, preferences) => {
        onFilterChange({
            allergies: allergies.join(','),
            dietaryPreferences: preferences.join(',')
        });
    };

    return (
        <div className="filter-container">
            <div className="allergy-section">
                <h3>Allergies</h3>
                {allergies.map(allergy => (
                    <label key={allergy.id} className="filter-item">
                        <input
                            type="checkbox"
                            checked={selectedAllergies.includes(allergy.id)}
                            onChange={() => handleAllergyChange(allergy.id)}
                        />
                        {allergy.name}
                    </label>
                ))}
            </div>

            <div className="dietary-section">
                <h3>Dietary Preferences</h3>
                {dietaryPreferences.map(preference => (
                    <label key={preference.id} className="filter-item">
                        <input
                            type="checkbox"
                            checked={selectedPreferences.includes(preference.id)}
                            onChange={() => handlePreferenceChange(preference.id)}
                        />
                        {preference.name}
                    </label>
                ))}
            </div>
        </div>
    );
};

export default AllergyFilter;