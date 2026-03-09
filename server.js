// ========================================
// KARIBU GROCERIES BACKEND - server.js
// PURE API VERSION for Render Deployment
// FIXED CORS - Single configuration
// ========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// ========================================
// CORS Configuration - SINGLE, CLEAN VERSION
// ========================================
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://kgl-system.netlify.app',  // ← Your Netlify URL (NO trailing slash!)
    'https://kgl-backend-ozz5.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        message: '🎉 Backend is working on Render!',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// Root route - Show API info
// ========================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'KGL Backend API is running',
        endpoints: {
            test: '/api/test',
            auth: '/api/auth/login',
            users: '/api/users',
            produce: '/api/produce',
            sales: '/api/sales',
            creditsales: '/api/creditsales',
            reports: '/api/reports'
        },
        frontend: 'https://kgl-system.netlify.app'  // ← Updated to match your URL
    });
});

// ========================================
// 404 handler for undefined routes
// ========================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: '/api/test, /api/auth/login, /api/users, etc.'
    });
});

// ========================================
// MongoDB Connection
// ========================================
console.log('🔄 Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ SUCCESS! Connected to MongoDB');
        console.log('📦 Database:', process.env.MONGODB_URI.split('/').pop().split('?')[0]);
    })
    .catch((error) => {
        console.log('❌ FAILED! Could not connect to MongoDB');
        console.log('Error:', error.message);
    });

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📝 Test API: https://kgl-backend-ozz5.onrender.com/api/test`);
    console.log(`🌐 Root URL: https://kgl-backend-ozz5.onrender.com`);
});
// TEMPORARY DEBUG ROUTE - Remove after testing
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('email role');
    res.json({ 
      success: true, 
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});