// ========================================
// Produce Controller - Handles stock management
// FIXED: Added better error handling and logging
// ========================================

const Produce = require('../models/Produce');

// @desc    Get all produce (stock)
// @route   GET /api/produce
// @access  Private (All roles can view)
const getProduce = async (req, res) => {
    try {
        console.log('📦 GET PRODUCE - User role:', req.user?.role, 'Branch:', req.user?.branch);
        
        let query = {};
        
        // If user is Manager or Sales, filter by their branch
        if (req.user.role === 'Manager' || req.user.role === 'Sales') {
            query.branch = req.user.branch;
        }
        
        // Optional branch filter in query params
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const produce = await Produce.find(query).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${produce.length} produce items`);
        
        res.json({
            success: true,
            produce
        });
    } catch (error) {
        console.error('❌ Get produce error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// @desc    Create new produce (procurement)
// @route   POST /api/produce
// @access  Private (Manager only)
const createProduce = async (req, res) => {
    try {
        console.log('\n========== NEW PROCUREMENT ==========');
        console.log('📦 Request body:', req.body);
        console.log('👤 User:', req.user?.email, 'Role:', req.user?.role);

        const {
            name, type, tonnage, cost, dealerName,
            dealerContact, sellingPrice, branch, date, time
        } = req.body;

        // Validate required fields
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!type) missingFields.push('type');
        if (!tonnage) missingFields.push('tonnage');
        if (!cost) missingFields.push('cost');
        if (!dealerName) missingFields.push('dealerName');
        if (!dealerContact) missingFields.push('dealerContact');
        if (!sellingPrice) missingFields.push('sellingPrice');
        if (!branch) missingFields.push('branch');
        if (!date) missingFields.push('date');
        if (!time) missingFields.push('time');

        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate tonnage (minimum 1000kg for procurement)
        if (tonnage < 1000) {
            return res.status(400).json({
                success: false,
                message: 'Tonnage must be at least 1000kg for procurement'
            });
        }

        // Validate branch matches user's branch
        if (branch !== req.user.branch) {
            console.log('❌ Branch mismatch:', branch, 'vs', req.user.branch);
            return res.status(400).json({
                success: false,
                message: 'Branch does not match your assigned branch'
            });
        }

        // Create new produce
        const newProduce = new Produce({
            name,
            type,
            tonnage: Number(tonnage),
            cost: Number(cost),
            dealerName,
            dealerContact,
            sellingPrice: Number(sellingPrice),
            branch,
            date,
            time
        });

        await newProduce.save();
        console.log('✅ Procurement saved with ID:', newProduce._id);
        console.log('=====================================\n');

        res.status(201).json({
            success: true,
            produce: newProduce,
            message: 'Procurement recorded successfully'
        });

    } catch (error) {
        console.error('❌ Create produce error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// @desc    Update produce (e.g., adjust price)
// @route   PUT /api/produce/:id
// @access  Private (Manager only)
const updateProduce = async (req, res) => {
    try {
        const { id } = req.params;
        const { sellingPrice } = req.body;

        console.log('✏️ Updating produce:', id, 'with price:', sellingPrice);

        const produce = await Produce.findById(id);
        
        if (!produce) {
            return res.status(404).json({
                success: false,
                message: 'Produce not found'
            });
        }

        // Check if user has permission (same branch)
        if (produce.branch !== req.user.branch) {
            return res.status(403).json({
                success: false,
                message: 'You can only update produce in your branch'
            });
        }

        // Only allow updating selling price
        if (sellingPrice) {
            produce.sellingPrice = Number(sellingPrice);
        }

        await produce.save();
        console.log('✅ Produce updated successfully');

        res.json({
            success: true,
            produce,
            message: 'Produce updated successfully'
        });

    } catch (error) {
        console.error('❌ Update produce error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete produce
// @route   DELETE /api/produce/:id
// @access  Private (Manager only)
const deleteProduce = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Deleting produce:', id);

        const produce = await Produce.findById(id);
        
        if (!produce) {
            return res.status(404).json({
                success: false,
                message: 'Produce not found'
            });
        }

        // Check if user has permission (same branch)
        if (produce.branch !== req.user.branch) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete produce in your branch'
            });
        }

        await Produce.findByIdAndDelete(id);
        console.log('✅ Produce deleted successfully');

        res.json({
            success: true,
            message: 'Produce deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete produce error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getProduce,
    createProduce,
    updateProduce,
    deleteProduce
};