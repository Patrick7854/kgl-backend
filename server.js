// ========================================
// KARIBU GROCERIES BACKEND - server.js
// FIXED - Points to correct frontend folder
// ========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// ========================================
// CORS Configuration
// ========================================
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// CRITICAL FIX: Point to the CORRECT frontend folder
// ========================================
// Now that index.html is inside frontend folder, this will work!
const frontendPath = path.join(__dirname, '../frontend');
console.log('📁 Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));

// ========================================
// Import Routes
// ========================================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const produceRoutes = require('./routes/produceRoutes');
const saleRoutes = require('./routes/saleRoutes');
const creditSaleRoutes = require('./routes/creditSaleRoutes');
const reportRoutes = require('./routes/reportRoutes');

// ========================================
// Use Routes (API endpoints)
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/creditsales', creditSaleRoutes);
app.use('/api/reports', reportRoutes);

// ========================================
// Test route
// ========================================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '🎉 Backend is working!',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// Handle ALL frontend routes
// ========================================
app.get('*', (req, res) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    // For any other URL, try to serve the file
    const filePath = path.join(frontendPath, req.url);
    
    // Send the file - if it doesn't exist, send index.html
    res.sendFile(filePath, (err) => {
        if (err) {
            // If file not found, send index.html for client-side routing
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
});

// ========================================
// MongoDB Connection
// ========================================
console.log('🔄 Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ SUCCESS! Connected to MongoDB');
        console.log('📦 Database: kgl_groceries');
    })
    .catch((error) => {
        console.log('❌ FAILED! Could not connect to MongoDB');
        console.log('Error:', error.message);
    });

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📝 Test API: http://localhost:${PORT}/api/test`);
    console.log(`🌐 Main page: http://localhost:${PORT}/index.html`);
    console.log(`🌐 Login page: http://localhost:${PORT}/pages/login.html`);
    console.log(`📁 Frontend path: ${frontendPath}`);
});