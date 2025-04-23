import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingNavbar.css';
import logo from '../../assets/images/logo.png';

const LandingNavbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <nav className="landing-navbar">
            <div className="landing-navbar-container">
                <Link to="/" className="landing-navbar-logo">
                    <img src={logo} alt="FoodHUB Logo" className="landing-logo-image" />
                </Link>

                <div className="landing-nav-links">
                    <Link to="/" className={`landing-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/menu" className={`landing-nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>
                        Menu
                    </Link>
                    <Link to="/bundles" className={`landing-nav-link ${location.pathname === '/bundles' ? 'active' : ''}`}>
                        Food Bundles
                    </Link>
                    <Link to="/pre-order" className={`landing-nav-link ${location.pathname === '/pre-order' ? 'active' : ''}`}>
                        Pre-Order
                    </Link>
                    {user ? (
                        <>
                            <Link to="/cart" className={`landing-nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
                                <span className="cart-icon">🛒</span> Cart
                            </Link>
                            <Link to="/orders" className={`landing-nav-link orders-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                                <span className="orders-icon">📋</span> Orders
                            </Link>
                            <button onClick={logout} className="landing-logout-button">
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="landing-auth-buttons">
                            <Link to="/login" className="landing-login-button">Login</Link>
                            <Link to="/register" className="landing-register-button">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default LandingNavbar; 