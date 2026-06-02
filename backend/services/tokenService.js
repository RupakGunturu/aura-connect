import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl });
}

export function createRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch {
    const error = new Error('Access token expired or invalid');
    error.status = 401;
    throw error;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    const error = new Error('Session expired. Please log in again.');
    error.status = 401;
    throw error;
  }
}
