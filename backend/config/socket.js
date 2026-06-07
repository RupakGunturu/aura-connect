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
      origin(origin, callback) {
        if (!origin || env.corsWhitelist.includes('*') || env.corsWhitelist.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS policy violation'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: false,
    maxHttpBufferSize: 65536,
    pingTimeout: 5000,
    pingInterval: 10000,
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

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.user.id}`);

    const rateLimits = {};
    socket.use((packet, next) => {
      const event = packet[0];
      const limits = { sendMessage: 30, 'typing:start': 20, 'typing:stop': 20, markRead: 30, joinConversation: 30, leaveConversation: 30 };
      const maxPerMin = limits[event];
      if (maxPerMin) {
        const now = Date.now();
        const entry = rateLimits[event] || (rateLimits[event] = { count: 0, resetAt: now + 60000 });
        if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60000; }
        entry.count++;
        if (entry.count > maxPerMin) {
          socket.emit('error', `Rate limit exceeded for "${event}"`);
          return;
        }
      }
      next();
    });

    initializeChatSocket(socket, io);
    initializePresenceSocket(socket);
    initializeCallSocket(socket);
    initializeWebrtcSocket(socket);
  });

  return io;
}
