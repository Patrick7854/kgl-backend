// ========================================
// Sale Controller - Handles cash sales
// FIXED: Added today's sales filtering
// ========================================

const Sale = require('../models/Sale');
const Produce = require('../models/Produce');
const User = require('../models/User');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (All roles)
const getSales = async (req, res) => {
    try {
        console.log('📊 GET SALES - User:', req.user?.email, 'Role:', req.user?.role);
        
        let query = {};
        
        // Filter by branch based on role
        if (req.user.role === 'Manager' || req.user.role === 'Sales') {
            query.branch = req.user.branch;
        }
        
        // Check if client wants today's sales only
        const { today } = req.query;
        
        if (today === 'true') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            
            query.dateTime = {
                $gte: startOfDay,
                $lte: endOfDay
            };
            console.log('📅 Filtering for today:', startOfDay, 'to', endOfDay);
        }
        
        const sales = await Sale.find(query).sort({ dateTime: -1 });
        
        console.log(`✅ Found ${sales.length} sales`);
        
        // Calculate totals
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.amountPaid || 0), 0);
        
        res.json({
            success: true,
            sales,
            summary: {
                count: sales.length,
                total: totalAmount
            }
        });
    } catch (error) {
        console.error('❌ Get sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private (Manager and Sales Agent)
const createSale = async (req, res) => {
    try {
        console.log('\n========== NEW SALE ==========');
        console.log('🔍 Request body:', req.body);
        console.log('👤 User:', req.user);

        const { produceName, quantity, amountPaid, buyerName } = req.body;

        // Validate required fields
        if (!produceName || !quantity || !amountPaid || !buyerName) {
            const missing = [];
            if (!produceName) missing.push('produceName');
            if (!quantity) missing.push('quantity');
            if (!amountPaid) missing.push('amountPaid');
            if (!buyerName) missing.push('buyerName');
            
            console.log('❌ Missing fields:', missing);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }

        // Find the produce to check stock
        console.log('🔍 Finding produce:', produceName, 'in branch:', req.user.branch);
        
        const produce = await Produce.findOne({ 
            name: produceName, 
            branch: req.user.branch 
        }).sort({ createdAt: -1 });

        if (!produce) {
            console.log('❌ Produce not found');
            return res.status(400).json({
                success: false,
                message: 'Produce not found in this branch'
            });
        }

        console.log('✅ Produce found:', produce.name, 'Available:', produce.tonnage, 'kg');

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

        // Create the sale
        const sale = new Sale({
            produceName,
            quantity: Number(quantity),
            amountPaid: Number(amountPaid),
            buyerName,
            salesAgent: user.name,
            branch: req.user.branch,
            dateTime: new Date()
        });

        await sale.save();
        console.log('✅ Sale saved with ID:', sale._id);

        // Reduce stock
        produce.tonnage -= Number(quantity);
        await produce.save();
        console.log('✅ Stock updated. Remaining:', produce.tonnage, 'kg');
        console.log('=====================================\n');

        res.status(201).json({
            success: true,
            sale,
            message: 'Sale recorded successfully'
        });

    } catch (error) {
        console.error('❌ Create sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// @desc    Get sales by date range
// @route   GET /api/sales/report
// @access  Private (Manager and Director)
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        console.log('📊 Sales report requested:', { startDate, endDate });
        
        let query = {};
        
        if (req.user.role === 'Manager' || req.user.role === 'Sales') {
            query.branch = req.user.branch;
        }
        
        if (startDate && endDate) {
            query.dateTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const sales = await Sale.find(query).sort({ dateTime: -1 });
        
        // Calculate totals
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.amountPaid || 0), 0);
        const totalQuantity = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
        
        console.log(`✅ Found ${sales.length} sales in date range`);
        
        res.json({
            success: true,
            sales,
            summary: {
                totalSales: sales.length,
                totalAmount,
                totalQuantity
            }
        });
        
    } catch (error) {
        console.error('❌ Get sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getSales,
    createSale,
    getSalesReport
};