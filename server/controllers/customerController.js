// controllers/customerController.js
import Customer from '../models/Customer.js';

export const createCustomer = async (req, res) => {
  try {
    const { name, address } = req.body;

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({ 
        message: 'Name and address are required' 
      });
    }

    // Check if customer with same name already exists
    const existing = await Customer.findOne({ name });
    if (existing) {
      return res.status(409).json({ 
        message: 'Customer with this name already exists',
        customer: existing
      });
    }

    const newCustomer = new Customer({ name, address });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ 
      message: 'Customer creation failed', 
      error: err.message 
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 }); // Sort by name
    res.json(customers);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching customers',
      error: err.message 
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching customer',
      error: err.message 
    });
  }
};

// Get customer by name (useful for auto-filling address)
export const getCustomerByName = async (req, res) => {
  try {
    const { name } = req.params;
    const customer = await Customer.findOne({ name });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching customer',
      error: err.message 
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { name, address } = req.body;
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, address },
      { new: true, runValidators: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error updating customer',
      error: err.message 
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error deleting customer',
      error: err.message 
    });
  }
};