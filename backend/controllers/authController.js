import { registerUser, authenticateUser, createSessionTokens, refreshSession, revokeRefreshToken } from '../services/authService.js';
import { requireFields } from '../utils/validation.js';

export async function register(req, res, next) {
  try {
    requireFields(req.body, ['email', 'password', 'profile']);
    requireFields(req.body.profile, ['name', 'handle']);
    const user = await registerUser(req.body);
    const tokens = await createSessionTokens(user);
    res.status(201).json({ user: { id: user._id, email: user.email, profile: user.profile }, tokens });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    requireFields(req.body, ['email', 'password']);
    const user = await authenticateUser(req.body.email, req.body.password);
    const tokens = await createSessionTokens(user);
    res.status(200).json({ user: { id: user._id, email: user.email, profile: user.profile }, tokens });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      const error = new Error('Refresh token required');
      error.status = 400;
      throw error;
    }
    const tokens = await refreshSession(refreshToken);
    res.status(200).json({ tokens });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    if (!req.user) {
      const error = new Error('User not authenticated');
      error.status = 401;
      throw error;
    }
    await revokeRefreshToken(req.user.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
