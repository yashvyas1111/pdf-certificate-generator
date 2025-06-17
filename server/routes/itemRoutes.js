import express from 'express';
import { createItem, getItems ,getItemByCode} from '../controllers/itemController.js';

const router = express.Router();

router.post('/', createItem);
router.get('/', getItems);

router.get('/code/:code', getItemByCode);

export default router
