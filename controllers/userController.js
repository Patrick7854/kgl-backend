// ========================================
// User Controller - Handles user management
// ========================================

const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Director only)
const getUsers = async (req, res) => {
    try {
        // Get all users, exclude passwords
        const users = await User.find().select('-password');
        
        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Director only)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, branch, contact } = req.body;

        // Check if all fields are provided
        if (!name || !email || !password || !role || !branch || !contact) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            branch,
            contact
        });

        // Save to database
        await newUser.save();

        // Remove password from response
        const userWithoutPassword = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            branch: newUser.branch,
            contact: newUser.contact
        };

        res.status(201).json({
            success: true,
            user: userWithoutPassword,
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Director only)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, branch, contact } = req.body;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow updating Director
        if (user.role === 'Director') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify Director account'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (branch) user.branch = branch;
        if (contact) user.contact = contact;

        await user.save();

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
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Director only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting Director
        if (user.role === 'Director') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete Director account'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};