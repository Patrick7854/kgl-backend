// ========================================
// User Routes
// ========================================

const express = require('express');
const router = express.Router();
const { protect, directorOnly } = require('../middleware/auth');
const {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

// All routes below require authentication and Director role
router.use(protect);
router.use(directorOnly);

// @route   GET /api/users
router.get('/', getUsers);

// @route   POST /api/users
router.post('/', createUser);

// @route   PUT /api/users/:id
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;