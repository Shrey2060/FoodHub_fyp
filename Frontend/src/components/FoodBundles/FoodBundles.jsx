import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../Layout/Layout';
import './FoodBundles.css';

// Simple LoadingSpinner component
const LoadingSpinner = () => (
  <div className="spinner">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Memoized bundle card component for better performance
const BundleCard = memo(({ bundle, onOrder, isProcessing }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => setImageLoaded(true);
    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(true);
    };

    const { originalPrice, price } = bundle;
    const savings = originalPrice - price;
    const percentage = Math.round((savings / originalPrice) * 100);

    return (
        <div className="bundle-card">
            <div className="bundle-image-container">
                {!imageLoaded && <div className="image-placeholder" />}
                <img
                    src={imageError ? '/images/bundles/default-bundle.jpg' : bundle.imageUrl}
                    alt={bundle.name}
                    className="bundle-image"
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                {percentage > 0 && (
                    <div className="bundle-badge">Save {percentage}%</div>
                )}
            </div>
            <div className="bundle-content">
                <h2>{bundle.name}</h2>
                <div className="bundle-tags">
                    {bundle.tags?.map((tag, index) => (
                        <span key={index} className="tag">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="bundle-items">
                    <h3>Included Items:</h3>
                    {bundle.items?.map((item, index) => (
                        <div key={index} className="bundle-item">
                            <span>{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                        </div>
                    ))}
                </div>
                <div className="bundle-price">
                    <div className="price-container">
                        <span className="original-price">
                            Rs. {originalPrice.toFixed(2)}
                        </span>
                        <span className="current-price">
                            Rs. {price.toFixed(2)}
                        </span>
                    </div>
                    <button
                        className="order-button"
                        onClick={() => onOrder(bundle)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Order Now'}
                    </button>
                </div>
            </div>
        </div>
    );
});

const defaultBundles = [
    {
        id: 1,
        name: "Student Value Pack",
        price: 499.99,
        originalPrice: 699.99,
        imageUrl: "/images/bundles/student-bundle.jpg",
        items: [
            { name: "Regular Burger", quantity: 2 },
            { name: "Medium French Fries", quantity: 1 },
            { name: "Regular Soft Drink", quantity: 2 },
            { name: "Ice Cream Sundae", quantity: 1 }
        ],
        tags: ["Best Seller", "Student Special"],
        experience: {
            title: "Student Food Challenge",
            description: "Complete the meal within 30 minutes and get a special reward!"
        }
    },
    {
        id: 2,
        name: "Family Feast Bundle",
        price: 999.99,
        originalPrice: 1299.99,
        imageUrl: "/images/bundles/family-bundle.jpg",
        items: [
            { name: "Premium Burger", quantity: 4 },
            { name: "Large French Fries", quantity: 2 },
            { name: "Regular Soft Drink", quantity: 4 },
            { name: "Dessert of Choice", quantity: 2 }
        ],
        tags: ["Family Size", "Best Value"],
        experience: {
            title: "Family Game Night",
            description: "Includes a digital family quiz game to enjoy while dining!"
        }
    },
    {
        id: 3,
        name: "Party Pack Special",
        price: 1499.99,
        originalPrice: 1999.99,
        imageUrl: "/images/bundles/party-bundle.jpg",
        items: [
            { name: "Signature Burger", quantity: 6 },
            { name: "Large French Fries", quantity: 3 },
            { name: "Regular Soft Drink", quantity: 6 },
            { name: "Dessert of Choice", quantity: 3 },
            { name: "Side Salad", quantity: 2 }
        ],
        tags: ["Party Size", "Great Value"],
        experience: {
            title: "Party Music Mix",
            description: "Access to our curated party playlist perfect for your gathering!"
        }
    }
];

const FoodBundles = () => {
    const [bundles, setBundles] = useState(defaultBundles); // Initialize with default bundles
    const [loading, setLoading] = useState(true);
    const [orderProcessing, setOrderProcessing] = useState(false);
    const [currentExperience, setCurrentExperience] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        // Debug user information
        console.log('Current user state:', user);
        console.log('Auth tokens available:', {
            localStorage: localStorage.getItem('token') ? 'Present' : 'Missing',
            sessionStorage: sessionStorage.getItem('authToken') ? 'Present' : 'Missing'
        });
        
        fetchBundles();
    }, [user]);

    const fetchBundles = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/bundles');
            if (response.data && response.data.success && response.data.bundles && Array.isArray(response.data.bundles) && response.data.bundles.length > 0) {
                // Format bundles for display if necessary
                const formattedBundles = response.data.bundles.map(bundle => ({
                    id: bundle.id,
                    name: bundle.name,
                    price: parseFloat(bundle.price),
                    originalPrice: parseFloat(bundle.original_price || bundle.originalPrice),
                    imageUrl: bundle.image_url || bundle.imageUrl || '/images/bundles/default-bundle.jpg',
                    items: bundle.items || [],
                    tags: bundle.tags || [],
                    experience: bundle.experiences ? {
                        title: bundle.experiences.trivia?.title || `${bundle.name} Experience`,
                        description: bundle.experiences.trivia?.description || 'Enjoy this special bundle experience!'
                    } : null
                }));
                setBundles(formattedBundles);
                console.log('Loaded bundles:', formattedBundles);
            } else {
                console.log('Using default bundles, API returned:', response.data);
                setBundles(defaultBundles);
                toast.info('Using default bundles while we update our menu.');
            }
        } catch (err) {
            console.error('Error fetching bundles:', err);
            setBundles(defaultBundles);
            toast.error('Error loading bundles. Showing default options.');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderBundle = async (bundle) => {
        if (!user) {
            toast.error('Please log in to order bundles');
            return;
        }

        setOrderProcessing(true);
        try {
            // Use sessionStorage authToken as that's what works in the Cart component
            const token = sessionStorage.getItem("authToken");
            
            if (!token) {
                toast.error('You need to be logged in to order. Please log in and try again.');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }
            
            // Calculate price with VAT
            const subtotal = bundle.price;
            const tax = subtotal * 0.13; // 13% VAT
            const total = subtotal + tax;
            
            // Instead of using bundle id, we need to use a valid product_id
            // First, try to fetch a valid product to use in the order
            try {
                console.log('Fetching a valid product to use for the bundle order');
                const productsResponse = await axios.get(
                    "http://localhost:5000/api/products",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                
                if (!productsResponse.data || !productsResponse.data.products || productsResponse.data.products.length === 0) {
                    throw new Error('No valid products found to create order');
                }
                
                // Use the first product's ID as our reference
                const validProductId = productsResponse.data.products[0].id;
                console.log('Using valid product ID:', validProductId);
                
                // Format order data with the valid product ID
                const orderData = {
                    items: [
                        {
                            product_id: validProductId, // Use a valid product ID that exists in the products table
                            quantity: 1,
                            price: parseFloat(bundle.price),
                            name: bundle.name, // Bundle name will be displayed in order history
                            bundle_items: bundle.items, // Store the actual bundle items for reference
                            description: `Bundle containing: ${bundle.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
                            is_bundle: true // Flag to identify this as a bundle
                        }
                    ],
                    total_amount: total,
                    status: 'pending',
                    delivery_address: user.address || 'Update address',
                    contact_number: user.phone || '1234567890',
                    payment_method: 'cash',
                    special_instructions: `Bundle order: ${bundle.name} - Items included: ${bundle.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`
                };
                
                // Log for debugging
                console.log('Creating bundle order with data:', orderData);
                
                const response = await axios.post(
                    "http://localhost:5000/api/orders/create",
                    orderData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data && response.data.success) {
                    toast.success('Bundle ordered successfully!');
                    
                    // If bundle has an experience, start it
                    if (bundle.experience) {
                        startExperience(bundle);
                    }
                    
                    // Navigate to order history to see the new order
                    setTimeout(() => {
                        window.location.href = '/orders';
                    }, 2000);
                } else {
                    throw new Error(response.data?.message || 'Failed to create order');
                }
            } catch (productError) {
                console.error('Error fetching valid product:', productError);
                toast.error('Could not find valid products to create an order. Please try again later.');
            }
        } catch (error) {
            console.error('Error ordering bundle:', error);
            console.error('Error response data:', error.response?.data);
            
            if (error.response?.status === 500) {
                toast.error('Server error. The order could not be processed. Please try again later.');
            } else if (error.response?.status === 403 || error.response?.status === 401) {
                toast.error('Authentication error. Please log in again to continue.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else {
                toast.error(error.response?.data?.message || error.message || 'Failed to order bundle. Please try again.');
            }
        } finally {
            setOrderProcessing(false);
        }
    };

    const startExperience = (bundle) => {
        setCurrentExperience({
            ...bundle.experience,
            bundleId: bundle.id
        });
    };

    const closeExperience = () => {
        setCurrentExperience(null);
    };

    if (loading) {
        return (
            <Layout>
                <div className="food-bundles-loading">
                    <LoadingSpinner />
                    <p>Loading delicious food bundles...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="food-bundles-container">
                <div className="content-wrapper">
                    <div className="bundles-header">
                        <h1>Food Bundles</h1>
                        <p>Choose from our carefully curated selection of food bundles</p>
                    </div>

                    <div className="bundles-grid">
                        {bundles.map((bundle) => (
                            <BundleCard
                                key={bundle.id}
                                bundle={bundle}
                                onOrder={handleOrderBundle}
                                isProcessing={orderProcessing}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {currentExperience && (
                <div className="experience-modal">
                    <div className="modal-content">
                        <button className="close-button" onClick={closeExperience}>
                            ×
                        </button>
                        <h2>{currentExperience.title}</h2>
                        <p>{currentExperience.description}</p>
                        <div className="modal-actions">
                            <button 
                                className="btn-primary"
                                onClick={closeExperience}
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default FoodBundles;
