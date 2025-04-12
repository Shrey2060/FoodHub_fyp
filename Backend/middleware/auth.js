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
            role: user.role,
            name: user.name
        }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' } // Token expires in 24 hours
    );
};

const authenticateToken = (req, res, next) => {
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
        req.user = decoded;
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
    try {
        const [users] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error verifying admin privileges'
        });
    }
};

module.exports = { generateToken, authenticateToken, isAdmin }; 