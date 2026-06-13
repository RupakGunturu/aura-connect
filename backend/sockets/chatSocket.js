import { isConversationMember } from '../utils/membership.js';
import { createMessage } from '../services/messageService.js';

export function initializeChatSocket(socket, io) {
  const userId = socket.user?.id;
  const userName = socket.user?.profile?.name;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('sendMessage', async (payload, ack) => {
    try {
      const rawSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      if (rawSize > 65536) {
        if (typeof ack === 'function') ack({ success: false, error: 'Message exceeds 64KB limit' });
        return;
      }
      payload.senderId = userId;
      const message = await createMessage(payload);
      socket.to(`conversation:${message.conversationId}`).emit('message', message);
      if (typeof ack === 'function') ack({ success: true, message });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  socket.on('joinConversation', async (conversationId) => {
    if (!(await isConversationMember(conversationId, userId))) {
      socket.emit('error', 'Access denied — you are not a participant of this conversation');
      return;
    }
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      userName,
    });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });
  });

  socket.on('markRead', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('conversationRead', {
      conversationId,
      userId,
    });
  });

  socket.on('disconnect', () => {
    socket.leaveAll();
  });
}
