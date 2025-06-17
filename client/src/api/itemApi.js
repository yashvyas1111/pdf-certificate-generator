import axios from 'axios';

export const createItem = async (data) => {
  const res = await axios.post('/api/items', data);
  return res.data;
};

export const getItems = async () => {
  const res = await axios.get('/api/items');
  return res.data;
};


// ✅ Get item by item code
export const getItemByCode = async (code) => {
  const res = await axios.get(`/api/items/code/${code}`);
  return res.data;
};