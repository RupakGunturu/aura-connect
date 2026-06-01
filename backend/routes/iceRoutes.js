import express from 'express';
import { getIceConfig } from '../controllers/iceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', requireAuth, getIceConfig);

export default router;
