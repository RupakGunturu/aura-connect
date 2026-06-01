import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const error = env.nodeEnv === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error');

  logger.error({ err, url: req.originalUrl, method: req.method }, 'Request error');
  res.status(status).json({ error });
}
