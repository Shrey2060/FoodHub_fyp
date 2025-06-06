import React from 'react';
import Navbar from '../Navbar/Navbar';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout; 