import express from 'express';
import { listConversations, getConversation, createNewConversation, joinConversation, leaveConversation, markAsRead } from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', listConversations);
router.post('/', createNewConversation);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId/join', joinConversation);
router.patch('/:conversationId/leave', leaveConversation);
router.patch('/:conversationId/read', markAsRead);

export default router;
