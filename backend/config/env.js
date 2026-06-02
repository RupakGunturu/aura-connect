import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envResult = dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (envResult.error) {
  console.warn('No .env file found — relying on platform environment variables');
}

const required = [
  'PORT',
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const present = required.filter((k) => Boolean(process.env[k]));
console.info(`Present required environment variables: ${present.join(', ')}`);

process.env.NODE_ENV ||= 'production';
// Default frontend origins for local dev and the deployed Vercel frontends.
process.env.FRONTEND_ORIGIN ||= 'http://localhost:5173';
process.env.CORS_WHITELIST ||= 'http://localhost:5173,http://localhost:5174,https://aura-connect-inky.vercel.app,https://aura-connect-rose.vercel.app';
process.env.ACCESS_TOKEN_TTL ||= '15m';
process.env.REFRESH_TOKEN_TTL ||= '30d';
process.env.RATE_LIMIT_WINDOW_MS ||= '900000';
process.env.RATE_LIMIT_MAX ||= '150';
process.env.SECURE_COOKIE ||= 'true';

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL,
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL,
  cookieSecret: process.env.COOKIE_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  corsWhitelist: process.env.CORS_WHITELIST.split(',').map((origin) => origin.trim()),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX),
  secureCookie: process.env.SECURE_COOKIE === 'true',
  turnUrl: process.env.TURN_URL || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnCredential: process.env.TURN_CREDENTIAL || '',
};
