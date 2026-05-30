export function initializeCallSocket(socket) {
  socket.on('callInvite', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('incomingCall', { ...payload, callerId: socket.user?.id });
  });

  socket.on('callAccept', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('callAccepted', payload);
  });

  socket.on('callReject', (payload) => {
    const targetRoom = `user:${payload.targetId}`;
    socket.to(targetRoom).emit('callRejected', payload);
  });
}
