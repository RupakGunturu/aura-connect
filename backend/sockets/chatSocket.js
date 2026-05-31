export function initializeChatSocket(socket, io) {
  const userId = socket.user?.id;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
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
