import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import './config/env.js';
import { connectDatabase } from './config/db.js';
import { createSocketServer } from './config/socket.js';
import { logger } from './utils/logger.js';

console.log('Backend starting; NODE_ENV=', process.env.NODE_ENV || 'unset');
console.log('Backend required env keys present:', {
  PORT: Boolean(process.env.PORT),
  MONGO_URI: Boolean(process.env.MONGO_URI),
  JWT_ACCESS_SECRET: Boolean(process.env.JWT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: Boolean(process.env.JWT_REFRESH_SECRET),
  COOKIE_SECRET: Boolean(process.env.COOKIE_SECRET),
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason && (reason.stack || reason));
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error && (error.stack || error));
});

const PORT = process.env.PORT || 4000;
let server;
let io;

async function startServer() {
  try {
    await connectDatabase();

    server = http.createServer(app);
    io = createSocketServer(server);
    app.set('io', io);

    server.listen(PORT, () => {
      logger.info(`SecureChat backend listening on port ${PORT}`);
      logger.info(`Socket.io ready with WSS authentication`);
    });

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id} user=${socket.user?.id ?? 'unknown'}`);
    });
  } catch (error) {
    console.error('Backend failed to start:', error && (error.stack || error));
    logger.error('Backend failed to start', error);
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  if (io) io.close();
  if (server) server.close();
  mongoose.disconnect().then(() => {
    logger.info('MongoDB disconnected');
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
