import express from 'express';
import { register, login, refreshToken, logout, completeOnboarding, changePasswordHandler, deleteAccountHandler, listSessionsHandler, revokeSessionHandler } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { registerValidation, loginValidation, changePasswordValidation, handleValidationErrors } from '../validators/authValidators.js';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authRateLimiter, registerValidation, handleValidationErrors, register);
router.post('/login', loginRateLimiter, loginValidation, handleValidationErrors, login);
router.post('/refresh', authRateLimiter, refreshToken);
router.post('/logout', requireAuth, logout);
router.patch('/onboarding', requireAuth, completeOnboarding);
router.patch('/password', requireAuth, changePasswordValidation, handleValidationErrors, changePasswordHandler);
router.delete('/account', requireAuth, deleteAccountHandler);
router.get('/sessions', requireAuth, listSessionsHandler);
router.delete('/sessions/:sessionId', requireAuth, revokeSessionHandler);

export default router;
