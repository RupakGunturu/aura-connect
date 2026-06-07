import express from 'express';
import { listConversations, getConversation, createNewConversation, joinConversation, leaveConversation, markAsRead, clearHistory, pinMessageHandler, unpinMessageHandler, setDisappearDurationHandler, deleteConversationForever } from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', listConversations);
router.post('/', createNewConversation);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId/join', joinConversation);
router.patch('/:conversationId/leave', leaveConversation);
router.patch('/:conversationId/read', markAsRead);
router.delete('/:conversationId', deleteConversationForever);
router.post('/:conversationId/clear', clearHistory);
router.patch('/:conversationId/pin/:messageId', pinMessageHandler);
router.patch('/:conversationId/unpin/:messageId', unpinMessageHandler);
router.patch('/:conversationId/disappear', setDisappearDurationHandler);

export default router;
