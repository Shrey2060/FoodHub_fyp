import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';
import logo from '../../assets/images/logo.png';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logo} alt="FoodHUB Logo" className="logo-image" />
                </Link>

                <div className="nav-links">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/menu" className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>
                        Menu
                    </Link>
                    <Link to="/bundles" className={`nav-link ${location.pathname === '/bundles' ? 'active' : ''}`}>
                        Food Bundles
                    </Link>
                    <Link to="/pre-order" className={`nav-link ${location.pathname === '/pre-order' ? 'active' : ''}`}>
                        Pre-Order
                    </Link>
                    {user && (
                        <>
                            <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
                                <span className="cart-icon">🛒</span> Cart
                            </Link>
                            <Link to="/orders" className={`nav-link orders-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                                <span className="orders-icon">📋</span> Orders
                            </Link>
                            <button onClick={logout} className="logout-button">
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 