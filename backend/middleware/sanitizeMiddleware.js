import { htmlEscape } from '../utils/validation.js';

const sensitiveFields = new Set(['password', 'currentPassword', 'newPassword']);

function sanitizeObject(obj, key = '') {
  if (typeof obj === 'string' && sensitiveFields.has(key)) {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizeObject(v));
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v, k)]),
    );
  }
  if (typeof obj === 'string') {
    return htmlEscape(obj.trim());
  }
  return obj;
}

export function sanitizeRequest(req, res, next) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}
