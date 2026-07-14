const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to DB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Update or Create Test User
    const testUser = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        name: 'Test Student',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'student',
        isTestUser: true
      },
      { upsert: true, new: true }
    );
    console.log('Created Test User: test@example.com');

    // Update or Create Admin User
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@system.local' },
      {
        name: 'System Admin',
        email: 'admin@system.local',
        password: hashedPassword,
        role: 'admin',
        isTestUser: true
      },
      { upsert: true, new: true }
    );
    console.log('Created Admin User: admin@system.local');

    console.log('Test users created successfully with password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
