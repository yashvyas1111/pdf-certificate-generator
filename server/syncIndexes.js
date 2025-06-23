// syncIndexes.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Certificate from './models/Certificate.js';

dotenv.config(); // ✅ This MUST come before using process.env

async function sync() {
  try {
    const mongoUri = process.env.MONGO_CONN;
    if (!mongoUri) {
      throw new Error('MONGO_URI is undefined. Check your .env file.');
    }

    await mongoose.connect(mongoUri);
    await Certificate.syncIndexes();
    console.log('✅ Indexes synced');
  } catch (err) {
    console.error('❌ Failed to sync indexes:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

sync();
