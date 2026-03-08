// ========================================
// User Model - Defines how user data is stored in MongoDB
// ========================================

const mongoose = require('mongoose');

// Define the schema (structure) for a user
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['Director', 'Manager', 'Sales'],
        required: [true, 'Role is required']
    },
    branch: {
        type: String,
        enum: ['Head Office', 'MAGANJO', 'MATUGGA'],
        required: [true, 'Branch is required']
    },
    contact: {
        type: String,
        required: [true, 'Contact is required'],
        match: [/^(?:\+256|0)[0-9]{9}$/, 'Please enter a valid Ugandan phone number']
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the model
const User = mongoose.model('User', userSchema);
module.exports = User;