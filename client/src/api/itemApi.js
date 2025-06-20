import axiosInstance from './axios';

export const createItem = async (data) => {
  const res = await axiosInstance.post('/api/items', data);
  return res.data;
};

export const getItems = async () => {
  const res = await axiosInstance.get('/api/items');
  return res.data;
};

// ✅ Get item by item code
export const getItemByCode = async (code) => {
  const res = await axiosInstance.get(`/api/items/code/${code}`);
  return res.data;
};
