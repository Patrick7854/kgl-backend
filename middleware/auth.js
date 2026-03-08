// ========================================
// Authentication Middleware
// ========================================

const jwt = require('jsonwebtoken');

// Verify token and protect routes
const protect = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = decoded;
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

// Check if user is Director
const directorOnly = (req, res, next) => {
    if (req.user.role !== 'Director') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Director only.'
        });
    }
    next();
};

module.exports = { protect, directorOnly };