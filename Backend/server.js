const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const pool = require('./config/db');

// Import routes
const searchRoutes = require('./routes/searchRoutes');
const bundleRoutes = require('./routes/bundleRoutes');
const walletRoutes = require('./routes/walletRoutes');
const chatbotRoutes = require('./routes/chatbot');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const khaltiRoutes = require('./routes/khaltiRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const preOrderRoutes = require('./routes/PreOrderRoutes');
const allergyRoutes = require('./routes/allergyRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminPreOrderRoutes = require('./routes/adminPreOrders'); // Admin Pre-Order CRUD
const adminUsersRoutes = require('./routes/adminUsers');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Log HTTP requests

// Mount routes
app.use("/api/search", searchRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/wallet", walletRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/payment", khaltiRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use('/api/pre-orders', preOrderRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin/pre-orders', adminPreOrderRoutes); // Register admin pre-orders route
app.use('/api/admin/users', adminUsersRoutes);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
