// ========================================
// Sale Routes
// ========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getSales,
    createSale,
    getSalesReport
} = require('../controllers/saleController');

// All routes require authentication
router.use(protect);

// GET all sales - All roles
router.get('/', getSales);

// GET sales report - Manager and Director
router.get('/report', getSalesReport);

// POST create sale - Manager and Sales Agent
router.post('/', (req, res, next) => {
    if (req.user.role === 'Director') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Directors cannot record sales.'
        });
    }
    next();
}, createSale);

module.exports = router;