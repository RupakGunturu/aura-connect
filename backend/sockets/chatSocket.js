export function initializeChatSocket(socket) {
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

  socket.on('sendMessage', (payload) => {
    const room = `conversation:${payload.conversationId}`;
    socket.to(room).emit('messageReceived', { ...payload, senderId: userId });
  });

  socket.on('disconnect', () => {
    socket.leaveAll();
  });
}
