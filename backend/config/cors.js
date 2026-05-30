import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsWhitelist.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS policy violation: origin not allowed')); 
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Authorization'],
};
