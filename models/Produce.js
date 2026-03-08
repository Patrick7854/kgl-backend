// ========================================
// Produce Model - Defines stock/produce data
// ========================================

const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Produce name is required'],
        enum: ['Beans', 'Maize', 'Cow Peas', 'Groundnuts', 'Soybeans']
    },
    type: {
        type: String,
        required: [true, 'Type is required']
    },
    tonnage: {
        type: Number,
        required: [true, 'Tonnage is required'],
        min: [0, 'Tonnage cannot be negative']
    },
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: [0, 'Cost cannot be negative']
    },
    dealerName: {
        type: String,
        required: [true, 'Dealer name is required']
    },
    dealerContact: {
        type: String,
        required: [true, 'Dealer contact is required'],
        match: [/^(?:\+256|0)[0-9]{9}$/, 'Please enter a valid Ugandan phone number']
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Price cannot be negative']
    },
    branch: {
        type: String,
        required: [true, 'Branch is required'],
        enum: ['MAGANJO', 'MATUGGA']
    },
    date: {
        type: String,
        required: [true, 'Date is required']
    },
    time: {
        type: String,
        required: [true, 'Time is required']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Produce', produceSchema);