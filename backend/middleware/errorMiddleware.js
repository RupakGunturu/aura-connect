import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  logger.error({ err, url: req.originalUrl, method: req.method }, 'Request error');
  res.status(status).json(response);
}
