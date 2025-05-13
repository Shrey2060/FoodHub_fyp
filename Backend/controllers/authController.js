const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const pool = require("../config/database");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user with verified: false
        const [result] = await pool.query(
            'INSERT INTO users (email, password, name, verified) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, name, false]
        );

        // Generate verification token (JWT)
        const verificationToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Invalid or missing token.' });
        let email;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            email = decoded.email;
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        // Set verified = true
        await pool.query('UPDATE users SET verified = ? WHERE email = ?', [true, email]);
        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user by email
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Block login if not verified
        if (!user.verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    verifyEmail
};
