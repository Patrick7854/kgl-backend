// ========================================
// Credit Sale Controller - Handles credit transactions
// UPDATED: Added support for Refugee ID
// ========================================

const CreditSale = require('../models/CreditSale');
const Produce = require('../models/Produce');
const User = require('../models/User');

// @desc    Get all credit sales
// @route   GET /api/creditsales
// @access  Private (All roles)
const getCreditSales = async (req, res) => {
    try {
        let query = {};
        
        // Filter by branch based on role
        if (req.user.role === 'Manager' || req.user.role === 'Sales') {
            query.branch = req.user.branch;
        }
        
        const creditSales = await CreditSale.find(query).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            creditSales
        });
    } catch (error) {
        console.error('Get credit sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create a new credit sale
// @route   POST /api/creditsales
// @access  Private (Manager and Sales Agent)
const createCreditSale = async (req, res) => {
    try {
        const { 
            buyerName, idType, idNumber, location, contact, amountDue,
            produceName, quantity, dueDate, dispatchDate 
        } = req.body;

        // Validate required fields
        if (!buyerName || !idType || !idNumber || !location || !contact || !amountDue || 
            !produceName || !quantity || !dueDate || !dispatchDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Find the produce to check stock
        const produce = await Produce.findOne({ 
            name: produceName, 
            branch: req.user.branch 
        }).sort({ createdAt: -1 });

        if (!produce) {
            return res.status(400).json({
                success: false,
                message: 'Produce not found in this branch'
            });
        }

        // Check if enough stock
        if (produce.tonnage < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${produce.tonnage}kg available`
            });
        }

        // Get the full user details from database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create the credit sale
        const creditSale = new CreditSale({
            buyerName,
            idType,
            idNumber,
            location,
            contact,
            amountDue,
            salesAgent: user.name,
            produceName,
            quantity,
            dueDate,
            dispatchDate,
            branch: req.user.branch,
            status: 'Pending'
        });

        await creditSale.save();

        // Reduce stock (same as cash sale)
        produce.tonnage -= quantity;
        await produce.save();

        res.status(201).json({
            success: true,
            creditSale,
            message: 'Credit sale recorded successfully'
        });

    } catch (error) {
        console.error('Create credit sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update credit sale status (mark as paid)
// @route   PUT /api/creditsales/:id
// @access  Private (Manager only)
const updateCreditStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const creditSale = await CreditSale.findById(id);
        
        if (!creditSale) {
            return res.status(404).json({
                success: false,
                message: 'Credit sale not found'
            });
        }

        creditSale.status = status || 'Paid';
        await creditSale.save();

        res.json({
            success: true,
            creditSale,
            message: `Credit sale marked as ${creditSale.status}`
        });

    } catch (error) {
        console.error('Update credit status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get credit sales summary (pending vs paid)
// @route   GET /api/creditsales/summary
// @access  Private (Manager and Director)
const getCreditSummary = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'Manager' || req.user.role === 'Sales') {
            query.branch = req.user.branch;
        }
        
        const pending = await CreditSale.find({ ...query, status: 'Pending' });
        const paid = await CreditSale.find({ ...query, status: 'Paid' });
        
        const pendingTotal = pending.reduce((sum, sale) => sum + sale.amountDue, 0);
        const paidTotal = paid.reduce((sum, sale) => sum + sale.amountDue, 0);
        
        res.json({
            success: true,
            summary: {
                pending: {
                    count: pending.length,
                    total: pendingTotal
                },
                paid: {
                    count: paid.length,
                    total: paidTotal
                },
                overall: {
                    count: pending.length + paid.length,
                    total: pendingTotal + paidTotal
                }
            }
        });
        
    } catch (error) {
        console.error('Get credit summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getCreditSales,
    createCreditSale,
    updateCreditStatus,
    getCreditSummary
};