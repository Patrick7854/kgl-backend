// ========================================
// Produce Routes
// ========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getProduce,
    createProduce,
    updateProduce,
    deleteProduce
} = require('../controllers/produceController');

// All routes require authentication
router.use(protect);

// GET all produce - All roles
router.get('/', getProduce);

// POST create produce - Manager only
router.post('/', (req, res, next) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Managers only.'
        });
    }
    next();
}, createProduce);

// PUT update produce - Manager only
router.put('/:id', (req, res, next) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Managers only.'
        });
    }
    next();
}, updateProduce);

// DELETE produce - Manager only
router.delete('/:id', (req, res, next) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Managers only.'
        });
    }
    next();
}, deleteProduce);

module.exports = router;