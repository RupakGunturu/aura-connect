export function initializeChatSocket(socket, io) {
  const userId = socket.user?.id;
  const userName = socket.user?.profile?.name;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('joinConversation', (conversationId) => {
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
