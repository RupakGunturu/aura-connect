import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './tokenService.js';

const SALT_ROUNDS = 12;

export async function registerUser({ email, password, profile }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({ email, passwordHash, profile });
  await user.save();
  return user;
}

export async function authenticateUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  return user;
}

export async function createSessionTokens(user) {
  const payload = { id: user._id.toString(), email: user.email };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

export async function refreshSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error('Refresh token invalid');
    error.status = 401;
    throw error;
  }
  return createSessionTokens(user);
}

export async function revokeRefreshToken(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}
