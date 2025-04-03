const isAdmin = (req, res, next) => {
    // Check if user exists and has role property
    if (!req.user || !req.user.role) {
        return res.status(403).json({
            success: false,
            message: "Access denied. User role not found.",
        });
    }

    // Verify if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required.",
        });
    }

    // If user is admin, proceed to next middleware
    next();
};

module.exports = isAdmin;