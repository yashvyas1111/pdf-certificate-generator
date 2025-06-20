// Load environment variables
import dotenv from 'dotenv';
dotenv.config();


// Core packages
import express from 'express';
console.log("✅ CPU Architecture:", process.arch);

import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
import './models/db.js';

// Create express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors());

// Serve static images if needed
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Import routes
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import itemRoutes from './routes/itemRoutes.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);

// Optional test route
app.get('/ydh', (req, res) => {
  res.send('hello there!');
});

// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
