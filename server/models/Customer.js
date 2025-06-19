// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true, // Ensure unique customer names
    trim: true
  },
  address: { 
    type: String, 
    required: false,
    trim: true
  }
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

export default mongoose.model('Customer', customerSchema);