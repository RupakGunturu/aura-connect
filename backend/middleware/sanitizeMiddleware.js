import { htmlEscape } from '../utils/validation.js';

function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeObject(value)]),
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
