const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Retrieve the Authorization header
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No token provided.",
            });
        }

        // Ensure the token follows the "Bearer <token>" format
        const [bearer, token] = authHeader.split(" ");
        if (bearer !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. Malformed token.",
            });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("❌ Token verification error:", err.message);
                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token.",
                });
            }

            // Check if decoded data has the required user ID
            if (!decoded.id) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid token payload.",
                });
            }

            // Attach decoded user data to the request object
            req.user = decoded;

            // Optional logging for debugging purposes
            console.log("✅ Token verified successfully. Decoded user:", req.user);

            // Proceed to the next middleware or route handler
            next();
        });
    } catch (error) {
        console.error("❌ An unexpected error occurred in authMiddleware:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

module.exports = authMiddleware;
