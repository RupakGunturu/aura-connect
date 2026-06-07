import express from 'express';
import { listMessages, sendMessage, updateDeliveryStatus, updateReadStatus, deleteMessage, deleteMessageForever } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/:conversationId', listMessages);
router.post('/', sendMessage);
router.patch('/:messageId/delivered', updateDeliveryStatus);
router.patch('/:messageId/read', updateReadStatus);
router.post('/:messageId/delete', deleteMessage);
router.delete('/:messageId', deleteMessageForever);

export default router;
