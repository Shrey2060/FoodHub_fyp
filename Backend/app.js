const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ===== Import Routes =====

// Public/User Routes
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const foodRoutes = require('./routes/foodRoutes');
const allergyRoutes = require('./routes/allergyRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/searchRoutes');

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');              // Admin Dashboard base
const adminProductRoutes = require('./routes/adminProducts');     // Product CRUD
const adminOrderRoutes = require('./routes/adminOrders');         // Order management
const adminUserRoutes = require('./routes/adminUsers');           // User management

// ===== API Route Handlers =====

// User APIs
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', searchRoutes); // general search route

// Admin APIs
app.use('/api/admin', adminRoutes); // base admin
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);

// ===== Error Handling Middleware =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
