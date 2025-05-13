const jwt = require("jsonwebtoken");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Access token is required"
            });
        }

        const [bearer, token] = authHeader.split(" ");
        if (bearer !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid token format"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                message: "Invalid token"
            });
        }
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

module.exports = { authenticateToken };
