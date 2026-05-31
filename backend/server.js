import http from 'http';
import app from './app.js';
import './config/env.js';
import { connectDatabase } from './config/db.js';
import { createSocketServer } from './config/socket.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);
    const io = createSocketServer(server);
    app.set('io', io);

    server.listen(PORT, () => {
      logger.info(`SecureChat backend listening on port ${PORT}`);
      logger.info(`Socket.io ready with WSS authentication`);
    });

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id} user=${socket.user?.id ?? 'unknown'}`);
    });
  } catch (error) {
    logger.error('Backend failed to start', error);
    process.exit(1);
  }
}

startServer();
