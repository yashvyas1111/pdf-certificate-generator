import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String, // Optional
}, { timestamps: true });

export default mongoose.model('User', userSchema);
