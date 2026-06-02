import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (error) => logger.error('MongoDB error', error));

  try {
    await mongoose.connect(env.mongoUri);
    logger.info('MongoDB connection successful');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error && (error.stack || error));
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    throw error;
  }
}
