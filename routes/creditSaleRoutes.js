// ========================================
// Credit Sale Routes
// ========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getCreditSales,
    createCreditSale,
    updateCreditStatus,
    getCreditSummary
} = require('../controllers/creditSaleController');

// All routes require authentication
router.use(protect);

// GET all credit sales - All roles
router.get('/', getCreditSales);

// GET credit summary - Manager and Director
router.get('/summary', getCreditSummary);

// POST create credit sale - Manager and Sales Agent
router.post('/', (req, res, next) => {
    if (req.user.role === 'Director') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Directors cannot record sales.'
        });
    }
    next();
}, createCreditSale);

// PUT update credit status - Manager only
router.put('/:id', (req, res, next) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Managers only.'
        });
    }
    next();
}, updateCreditStatus);

module.exports = router;