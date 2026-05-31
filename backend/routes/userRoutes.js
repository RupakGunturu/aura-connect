import express from 'express';
import { getProfile, updateProfile, updateSettings, getUserByHandle, queryUsers, blockUserHandler, unblockUserHandler, listBlockedUsersHandler, updatePublicKey, getPublicKey } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.get('/me', getProfile);
router.patch('/me/profile', updateProfile);
router.patch('/me/settings', updateSettings);
router.get('/search', queryUsers);
router.get('/handle/:handle', getUserByHandle);
router.get('/blocked', listBlockedUsersHandler);
router.post('/blocked/:userId', blockUserHandler);
router.delete('/blocked/:userId', unblockUserHandler);
router.put('/me/public-key', updatePublicKey);
router.get('/:userId/public-key', getPublicKey);

export default router;
