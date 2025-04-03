import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LocalPartnerships = () => {
    const [partners, setPartners] = useState([]);
    const [featuredPartners, setFeaturedPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [partnersRes, featuredRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/partners'),
                    axios.get('http://localhost:5000/api/partners/featured')
                ]);

                setPartners(partnersRes.data.partners);
                setFeaturedPartners(featuredRes.data.partners);
            } catch (err) {
                setError('Failed to fetch partners');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="partnerships-container">
            <header className="partnerships-header">
                <h1>Our Local Partners</h1>
                <p>Discover exclusive deals from our trusted local partners</p>
            </header>

            {featuredPartners.length > 0 && (
                <section className="featured-partners">
                    <h2>Featured Partners</h2>
                    <div className="featured-partners-grid">
                        {featuredPartners.map(partner => (
                            <div key={partner.id} className="featured-partner-card">
                                <img src={partner.logo_url} alt={partner.name} />
                                <div className="partner-info">
                                    <h3>{partner.name}</h3>
                                    <p>{partner.description}</p>
                                    <div className="partner-rating">
                                        Rating: {partner.rating} ⭐
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="all-partners">
                <h2>All Partners</h2>
                <div className="partners-grid">
                    {partners.map(partner => (
                        <div key={partner.id} className="partner-card">
                            <img src={partner.logo_url} alt={partner.name} />
                            <div className="partner-info">
                                <h3>{partner.name}</h3>
                                <p>{partner.description}</p>
                                <div className="partner-details">
                                    <span>📍 {partner.address}</span>
                                    <span>📞 {partner.contact_number}</span>
                                </div>
                                <div className="partner-rating">
                                    Rating: {partner.rating} ⭐
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LocalPartnerships;