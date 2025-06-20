import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

export default axiosInstance;
export { BASE_URL }; 