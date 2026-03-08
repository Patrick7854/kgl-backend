// ========================================
// Auth Controller - Handles login logic
// ========================================

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 Login attempt for:', email);
        console.log('🔍 Password received:', password);

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });
        
        console.log('🔍 User found in DB:', user ? 'Yes' : 'No');
        
        // If user doesn't exist
        if (!user) {
            console.log('🔍 User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('🔍 Stored password hash:', user.password);

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        
        console.log('🔍 Password match:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                branch: user.branch 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Remove password from response
        const userWithoutPassword = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            branch: user.branch,
            contact: user.contact
        };

        res.json({
            success: true,
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    loginUser
};