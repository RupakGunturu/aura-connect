import express from 'express';
import { getFriends, getIncomingRequests, getOutgoingRequests, sendRequest, acceptRequest, rejectRequest, removeFriendHandler } from '../controllers/friendController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', getFriends);
router.get('/incoming', getIncomingRequests);
router.get('/outgoing', getOutgoingRequests);
router.post('/request', sendRequest);
router.patch('/request/:requestId/accept', acceptRequest);
router.patch('/request/:requestId/reject', rejectRequest);
router.delete('/:friendId', removeFriendHandler);

export default router;
