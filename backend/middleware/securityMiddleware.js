import { env } from '../config/env.js';

export function securityMiddleware(req, res, next) {
  if (env.nodeEnv === 'production') {
    const forwardedProto = req.get('x-forwarded-proto');
    if (forwardedProto && forwardedProto !== 'https') {
      return res.status(426).json({ error: 'HTTPS required' });
    }
    if (!req.secure && !forwardedProto) {
      return res.status(426).json({ error: 'HTTPS required' });
    }
  }
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
}
