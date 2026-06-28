import mongoose from 'mongoose';
import { seedDB } from './seed.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasktracker');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed database if empty
    await seedDB();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
