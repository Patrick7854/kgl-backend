// ========================================
// Sale Model - Records cash sales
// ========================================

const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    produceName: {
        type: String,
        required: [true, 'Produce name is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1kg']
    },
    amountPaid: {
        type: Number,
        required: [true, 'Amount paid is required'],
        min: [0, 'Amount cannot be negative']
    },
    buyerName: {
        type: String,
        required: [true, 'Buyer name is required']
    },
    salesAgent: {
        type: String,
        required: [true, 'Sales agent name is required']
    },
    branch: {
        type: String,
        required: [true, 'Branch is required'],
        enum: ['MAGANJO', 'MATUGGA']
    },
    dateTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);