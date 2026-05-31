import express from 'express';
import { register, login, refreshToken, logout, completeOnboarding, changePasswordHandler, deleteAccountHandler, listSessionsHandler, revokeSessionHandler } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', requireAuth, logout);
router.patch('/onboarding', requireAuth, completeOnboarding);
router.patch('/password', requireAuth, changePasswordHandler);
router.delete('/account', requireAuth, deleteAccountHandler);
router.get('/sessions', requireAuth, listSessionsHandler);
router.delete('/sessions/:sessionId', requireAuth, revokeSessionHandler);

export default router;
