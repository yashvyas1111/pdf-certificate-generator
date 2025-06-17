import axios from 'axios';


export const getCustomers = async () => {
  const res = await axios.get('/api/customers');
  return res.data;
};

export const createCustomer = async (data) => {
  const res = await axios.post('/api/customers', data);
  return res.data;
};


