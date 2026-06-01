import { Server } from 'socket.io';
import { verifyAccessToken } from '../services/tokenService.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { initializeChatSocket } from '../sockets/chatSocket.js';
import { initializePresenceSocket } from '../sockets/presenceSocket.js';
import { initializeCallSocket } from '../sockets/callSocket.js';
import { initializeWebrtcSocket } from '../sockets/webrtcSocket.js';

export function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: env.frontendOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: env.nodeEnv === 'production' ? ['websocket'] : ['polling', 'websocket'],
    allowEIO3: false,
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    try {
      const payload = await verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (error) {
      logger.warn('Socket auth failed', error.message);
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    initializeChatSocket(socket, io);
    initializePresenceSocket(socket);
    initializeCallSocket(socket);
    initializeWebrtcSocket(socket);
  });

  return io;
}
