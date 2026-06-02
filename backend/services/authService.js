import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { CallSession } from '../models/CallSession.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './tokenService.js';

const SALT_ROUNDS = 12;

export async function registerUser({ email, password, profile }) {
  const existing = await User.findOne({ $or: [{ email }, { 'profile.handle': profile?.handle }] });
  if (existing) {
    if (existing.email === email) {
      const error = new Error('Email already in use');
      error.status = 409;
      throw error;
    }
    const error = new Error('Handle already taken');
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

export async function createSessionTokens(user, deviceInfo = '') {
  const sessionId = crypto.randomUUID();
  const payload = { id: user._id.toString(), email: user.email, sessionId };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  user.sessions.push({ sessionId, refreshToken, deviceInfo });
  await user.save();

  return { accessToken, refreshToken };
}

export async function refreshSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found');
    error.status = 401;
    throw error;
  }

  const session = user.sessions.find((s) => s.sessionId === payload.sessionId && s.refreshToken === refreshToken);
  if (!session) {
    const error = new Error('Session invalid or revoked');
    error.status = 401;
    throw error;
  }

  session.lastActiveAt = new Date();
  const newPayload = { id: user._id.toString(), email: user.email, sessionId: payload.sessionId };
  const newAccessToken = createAccessToken(newPayload);
  const newRefreshToken = createRefreshToken(newPayload);
  session.refreshToken = newRefreshToken;
  await user.save();

  user.sessions = undefined;
  return {
    tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    user: { id: user._id, email: user.email, profile: user.profile, onboardingComplete: user.onboardingComplete, settings: user.settings },
  };
}

export async function revokeRefreshToken(userId, sessionId) {
  await User.findByIdAndUpdate(userId, { $pull: { sessions: { sessionId } } });
}

export async function completeUserOnboarding(userId, { bio, avatarUrl, privacyMode, allowUnknownMessages }) {
  const update = { onboardingComplete: true };
  if (bio !== undefined) update['profile.bio'] = bio;
  if (avatarUrl !== undefined) update['profile.avatarUrl'] = avatarUrl;
  if (privacyMode !== undefined) update['settings.privacyMode'] = privacyMode;
  if (allowUnknownMessages !== undefined) update['settings.allowUnknownMessages'] = allowUnknownMessages;

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error('Current password is incorrect');
    error.status = 401;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.sessions = [];
  await user.save();
}

export async function deleteAccount(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  await Message.deleteMany({ senderId: userId });
  await Conversation.updateMany({}, { $pull: { participants: userId } });
  await Conversation.deleteMany({ participants: { $size: 0 } });
  await CallSession.deleteMany({ participants: userId });
  await User.findByIdAndDelete(userId);
}

export async function listSessions(userId) {
  const user = await User.findById(userId).select('sessions');
  if (!user) return [];
  return user.sessions.map((s) => ({
    sessionId: s.sessionId,
    deviceInfo: s.deviceInfo,
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt,
  }));
}
