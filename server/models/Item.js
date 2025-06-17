import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  code:   { type: String, required: true, unique: true },

  material: { type: String, required: true },
  size:     { type: String, required: true }
});
export default mongoose.model('Item', itemSchema);
