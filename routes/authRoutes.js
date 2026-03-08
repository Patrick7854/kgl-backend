// ========================================
// Auth Routes - Defines login API endpoint
// ========================================

const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

module.exports = router;