import express from 'express';
import { loginWithEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginWithEmail);

export default router;
