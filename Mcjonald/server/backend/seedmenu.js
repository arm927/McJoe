
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Menu from './models/menu.js';
import { seedMenu } from '../../frontend/src/data/seed.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    const count = await Menu.countDocuments();

    if (count > 0) {
      console.log('Menu already contains data. No items added.');
    } else {
      const items = seedMenu.map(({ id, ...item }) => item);
      await Menu.insertMany(items);
      console.log(`${items.length} menu items added successfully!`);
    }
  } catch (error) {
    console.error('Menu seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedDatabase();
