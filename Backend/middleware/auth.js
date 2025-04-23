const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'foodhub'
});

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            name: user.name,
            role: user.role
        }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication token is required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Check if user exists in database
        const [users] = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'User not found'
            });
        }

        // Set user info from database to ensure it's current
        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                success: false, 
                message: 'Token has expired',
                expired: true
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token'
        });
    }
};

const isAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ 
            success: false, 
            message: 'User not authenticated'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

module.exports = { generateToken, authenticateToken, isAdmin };