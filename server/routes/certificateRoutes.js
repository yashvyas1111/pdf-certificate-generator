import express from 'express';
import {
  createCertificate,
  getCertificateById,
  getAllCertificates,
  deleteCertificate,
  updateCertificate,
  downloadCertificatePdf,
  previewCertificate,
  sendCertificateEmail,
  searchCertificates,
} from '../controllers/certificateController.js';

const router = express.Router();

router.get('/search', searchCertificates);     // ✅ put search route first
router.get('/', getAllCertificates);
router.post('/', createCertificate);

router.get('/:id/pdf', downloadCertificatePdf);
router.get('/:id', getCertificateById);
router.delete('/:id', deleteCertificate);
router.put('/:id', updateCertificate);
router.post('/preview', previewCertificate);
router.post('/:id/email', sendCertificateEmail);


export default router;