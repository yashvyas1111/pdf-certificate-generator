import axios from 'axios';


export const searchCertificates = async (query) => {
  const res = await axios.get('/api/certificates/search', {
    params: { query },
  });
  return res.data;
};

export const getNextCertificateSuffix = async () => {
  const res = await axios.get('/api/certificates/next-suffix');
  return res.data;
};


export const createCertificate = async (data) => {
  const res = await axios.post('/api/certificates', data);
  return res.data;
};



export const getAllCertificates = async () => {
  const res = await axios.get('/api/certificates');
  return res.data;
};

export const getCertificateById = async (id) => {
  const res = await axios.get(`/api/certificates/${id}`);
  return res.data;
};

export const deleteCertificate = async (id) => {
  const res = await axios.delete(`/api/certificates/${id}`);
  return res.data;
};

export const updateCertificate = async (id, data) => {
  const res = await axios.put(`/api/certificates/${id}`, data);
  return res.data;
};

// 👇 For Preview PDF (get PDF Blob)
export const getCertificatePreview = async (data) => {
  const res = await axios.post('/api/certificates/preview', data, {
    responseType: 'blob', // to handle PDF file
  });
  return res.data;
};


export const sendCertificateEmail = async (certificateId, email) => {
  const res = await axios.post(`/api/certificates/${certificateId}/email`, {
    email,
    includeHeader: true, 
  });
  return res.data;
};
