import axiosInstance from "./axios";

export const searchCertificates = async (query) => {
  const res = await axiosInstance.get('/api/certificates/search', {
    params: { query },
  });
  return res.data;
};

export const getNextCertificateSuffix = async (date) => {
  const res = await axiosInstance.get('/api/certificates/next-suffix', {
    params: { date }   // <-- pass date as query param
  });
  return res.data;
};

export const createCertificate = async (data) => {
  const res = await axiosInstance.post('/api/certificates', data);
  return res.data;
};

export const getAllCertificates = async () => {
  const res = await axiosInstance.get('/api/certificates');
  return res.data;
};

export const getCertificateById = async (id) => {
  const res = await axiosInstance.get(`/api/certificates/${id}`);
  return res.data;
};

export const deleteCertificate = async (id) => {
  const res = await axiosInstance.delete(`/api/certificates/${id}`);
  return res.data;
};

export const updateCertificate = async (id, data) => {
  const res = await axiosInstance.put(`/api/certificates/${id}`, data);
  return res.data;
};

// 👇 For Preview PDF (get PDF Blob)
export const getCertificatePreview = async (data) => {
  const res = await axiosInstance.post('/api/certificates/preview', data, {
    responseType: 'blob', // to handle PDF file
  });
  return res.data;
};

export const sendCertificateEmail = async (certificateId, email) => {
  const res = await axiosInstance.post(`/api/certificates/${certificateId}/email`, {
    email,
    includeHeader: true,
  });
  return res.data;
};
