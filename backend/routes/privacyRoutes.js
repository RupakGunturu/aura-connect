import express from 'express';
import { getPrivacy, updatePrivacy } from '../controllers/privacyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getPrivacy);
router.patch('/', updatePrivacy);

export default router;
