import Customer from '../models/Customer.js';

export const createCustomer = async (req, res) => {
  try {
    const { name, number } = req.body;

    // Check if already exists
    const existing = await Customer.findOne({ name });
    if (existing) return res.status(200).json(existing);

    const newCustomer = new Customer({ name, number });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ message: 'Customer creation failed', error: err.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
};
