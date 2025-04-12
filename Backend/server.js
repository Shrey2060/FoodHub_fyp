const express = require("express");
const http = require("http"); // Required for Socket.io
const socketIo = require("socket.io"); // Real-time communication
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet"); // Security headers
const morgan = require("morgan"); // Logging
const db = require("./config/db"); // Database connection

const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const cartRoutes = require("./routes/cartRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const chatRoutes = require("./routes/chatRoutes"); // ✅ Chat routes
const adminRoutes = require("./routes/adminRoutes"); // ✅ Admin routes
const searchRoutes = require("./routes/searchRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const khaltiRoutes = require("./routes/khaltiRoutes");
const orderRoutes = require("./routes/orderRoutes"); // ✅ Order routes
const productRoutes = require("./routes/productRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const preOrderRoutes = require('./routes/PreOrderRoutes');
const chatbotRoutes = require('./routes/chatbot');
const bundleRoutes = require('./routes/bundleRoutes');

// Load environment variables
dotenv.config();

// Initialize the Express app & create HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow frontend access
    },
});

// ✅ Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(helmet()); // Secure HTTP headers
app.use(morgan("dev")); // Log HTTP requests
app.use("/api", searchRoutes);
app.use("/api/bundles", bundleRoutes);

// ✅ Test database connection
db.getConnection()
    .then(connection => {
        console.log("✅ Connected to MySQL database.");
        connection.release();
    })
    .catch(err => {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1); // Exit if the database connection fails
    });

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/chat", chatRoutes); // ✅ Chat API route enabled
app.use("/api/admin", adminRoutes); // ✅ Admin API route enabled
app.use("/api/rewards", rewardRoutes); 
app.use("/api/payment", khaltiRoutes);
app.use("/api/orders", orderRoutes); // ✅ Order routes enabled
app.use("/api/products", productRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use('/api/pre-orders', preOrderRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ✅ Root endpoint (Optional)
app.get("/", (req, res) => {
    res.send("Welcome to the FoodHub API!");
});

// ✅ Middleware for undefined routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: "The requested route does not exist." });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
    console.error("❌ An error occurred:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
});

// ✅ Real-time Chat Feature using Socket.io
io.on("connection", (socket) => {
    console.log(`✅ A user connected: ${socket.id}`);

    // Join Chat Room
    socket.on("joinRoom", (chatRoomId) => {
        socket.join(chatRoomId);
        console.log(`User joined chat room: ${chatRoomId}`);
    });

    // Handle Sending Messages
    socket.on("sendMessage", (data) => {
        console.log("📨 Message Received:", data);

        const { chatRoomId, senderId, receiverId, message } = data;

        const query = `
            INSERT INTO chat_messages (chat_room_id, sender_id, receiver_id, message, created_at) 
            VALUES (?, ?, ?, ?, NOW())`;

        db.query(query, [chatRoomId, senderId, receiverId, message], (err) => {
            if (err) {
                console.error("❌ Database Error Saving Message:", err.message);
                return;
            }

            // Broadcast message to the chat room
            io.to(chatRoomId).emit("receiveMessage", { senderId, receiverId, message });
        });
    });

    // Handle User Disconnect
    socket.on("disconnect", () => {
        console.log(`❌ A user disconnected: ${socket.id}`);
    });
});

// ✅ Resolve potential port conflicts and start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
