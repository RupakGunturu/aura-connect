import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no origin), any origin when '*' is configured,
    // or exact matches from the whitelist.
    if (!origin || env.corsWhitelist.includes('*') || env.corsWhitelist.includes(origin)) {
      callback(null, true);
      return;
    }
    // Log blocked origin to help debugging in deployment logs.
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('CORS policy violation: origin not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Authorization'],
};
