
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import User from './models/users.js';

dotenv.config();

const createEmployee = async () => {
  try {
    await connectDB();

    const email = 'employee@mcjoe.com';
    const username = 'staff';

    const existing = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existing) {
      console.log('Employee account already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash('staff123', 12);

    await User.create({
      name: 'Employee',
      email,
      username,
      password: hashedPassword,
      role: 'Employee'
    });

    console.log('Employee account created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

createEmployee();
