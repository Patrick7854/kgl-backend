// backend/fix-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First, let's see all users
    const allUsers = await User.find().select('email password');
    console.log('\n📋 Current users in database:');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (password hash: ${u.password.substring(0, 20)}...)`);
    });

    // Delete the corrupted user
    console.log('\n🗑️ Deleting corrupted director user...');
    await User.deleteOne({ email: 'director@karibugroceries.com' });
    console.log('✅ Deleted old user');

    // Create a fresh user with proper password hash
    console.log('\n🔐 Creating new user with fresh password hash...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newUser = await User.create({
      name: 'Mr. Orban',
      email: 'director@karibugroceries.com',
      password: hashedPassword,
      role: 'Director',
      branch: 'Head Office',
      contact: '+256700123456'
    });

    console.log('✅ New user created successfully!');
    console.log('📧 Email:', newUser.email);
    console.log('🔑 Password:', 'password123');
    console.log('🔐 New hash:', newUser.password);

    // Verify the password works
    console.log('\n🔍 Testing the new password...');
    const testMatch = await bcrypt.compare('password123', newUser.password);
    console.log('✅ Password test:', testMatch ? 'PASSED' : 'FAILED');

    if (!testMatch) {
      console.log('❌ Something is still wrong with bcrypt!');
    }

    // Also create/fix manager users
    console.log('\n👤 Creating manager users...');
    
    const managers = [
      {
        name: 'John Manager',
        email: 'manager.matugga@karibugroceries.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Manager',
        branch: 'MATUGGA',
        contact: '+256700123457'
      },
      {
        name: 'Sarah Manager',
        email: 'manager.maganjo@karibugroceries.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Manager',
        branch: 'MAGANJO',
        contact: '+256700123458'
      }
    ];

    for (const manager of managers) {
      await User.deleteOne({ email: manager.email });
      const m = await User.create(manager);
      console.log(`   ✅ Created: ${m.email}`);
    }

    console.log('\n🎉 ALL FIXED! Try logging in now!');
    console.log('=====================================');
    console.log('📝 Login with:');
    console.log('   director@karibugroceries.com / password123');
    console.log('   manager.matugga@karibugroceries.com / password123');
    console.log('   manager.maganjo@karibugroceries.com / password123');
    console.log('=====================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUser();