export function initializePresenceSocket(socket) {
  socket.on('online', () => {
    socket.broadcast.emit('userOnline', { userId: socket.user?.id });
  });

  socket.on('offline', () => {
    socket.broadcast.emit('userOffline', { userId: socket.user?.id });
  });
}
