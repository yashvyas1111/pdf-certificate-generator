// controllers/itemController.js
import Item from '../models/Item.js';

export const createItem = async (req, res) => {
  try {
    const { code, material, size } = req.body;

    const existing = await Item.findOne({ code });
    if (existing) return res.status(200).json(existing);

    const newItem = new Item({ code,material, size });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: 'Item creation failed', error: err.message });
  }
};


export const getItemByCode = async (req, res) => {
  try {
    const { code } = req.params; // e.g. /api/items/code/:code
    const item = await Item.findOne({ code }).lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err.message });
  }
};



export const getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items' });
  }
};
