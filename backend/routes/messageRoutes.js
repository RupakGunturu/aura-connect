import express from 'express';
import { listMessages, sendMessage, updateDeliveryStatus, updateReadStatus, deleteMessage } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/:conversationId', listMessages);
router.post('/', sendMessage);
router.patch('/:messageId/delivered', updateDeliveryStatus);
router.patch('/:messageId/read', updateReadStatus);
router.post('/:messageId/delete', deleteMessage);

export default router;
