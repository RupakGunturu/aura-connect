import express from 'express';
import { createCall, getCall, updateCall, endCall } from '../controllers/callController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.post('/', createCall);
router.get('/:callId', getCall);
router.patch('/:callId', updateCall);
router.patch('/:callId/end', endCall);

export default router;
