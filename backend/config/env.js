import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envResult = dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (envResult.error) {
  throw new Error('Failed to load backend .env configuration');
}

const required = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
  'FRONTEND_ORIGIN',
  'CORS_WHITELIST'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

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
