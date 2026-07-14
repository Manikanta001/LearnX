const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx';
    const conn = await mongoose.connect(connUri);
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not call process.exit(1) in Serverless environments as it crashes Vercel containers
    throw error;
  }
};

module.exports = { connectDB };
