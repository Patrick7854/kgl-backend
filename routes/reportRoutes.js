// ========================================
// Reports Routes
// ========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getDashboardSummary,
    getSalesReport,
    getCreditReport,
    getStockReport
} = require('../controllers/reportController');

// All routes require authentication
router.use(protect);

// GET dashboard summary (KPI cards) - All roles
router.get('/dashboard', getDashboardSummary);

// GET sales report - Manager and Director
router.get('/sales', (req, res, next) => {
    if (req.user.role === 'Sales') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Sales agents cannot view reports.'
        });
    }
    next();
}, getSalesReport);

// GET credit report - Manager and Director
router.get('/credit', (req, res, next) => {
    if (req.user.role === 'Sales') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Sales agents cannot view reports.'
        });
    }
    next();
}, getCreditReport);

// GET stock report - All roles
router.get('/stock', getStockReport);

module.exports = router;