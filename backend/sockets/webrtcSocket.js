export function initializeWebrtcSocket(socket) {
  socket.on('webrtcOffer', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('webrtcOffer', { ...payload, senderId: socket.user?.id });
  });

  socket.on('webrtcAnswer', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('webrtcAnswer', payload);
  });

  socket.on('webrtcIceCandidate', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('webrtcIceCandidate', payload);
  });
}
