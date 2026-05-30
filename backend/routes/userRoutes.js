import express from 'express';
import { getProfile, updateProfile, updateSettings, getUserByHandle, queryUsers } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.get('/me', getProfile);
router.patch('/me/profile', updateProfile);
router.patch('/me/settings', updateSettings);
router.get('/search', queryUsers);
router.get('/handle/:handle', getUserByHandle);

export default router;
