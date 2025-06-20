import axiosInstance from './axios';

export const getCustomers = async () => {
  const res = await axiosInstance.get('/api/customers');
  return res.data;
};

export const createCustomer = async (data) => {
  const res = await axiosInstance.post('/api/customers', data);
  return res.data;
};
