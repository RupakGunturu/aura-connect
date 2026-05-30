import { verifyAccessToken } from '../services/tokenService.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization?.split(' ');
  if (!authHeader || authHeader[0] !== 'Bearer' || !authHeader[1]) {
    const error = new Error('Authorization header missing or malformed');
    error.status = 401;
    return next(error);
  }

  try {
    const payload = verifyAccessToken(authHeader[1]);
    const user = await User.findById(payload.id).select('-passwordHash -refreshToken');
    if (!user) {
      const error = new Error('User not found');
      error.status = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (err) {
    err.status = err.status || 401;
    next(err);
  }
}
