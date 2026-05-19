import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "./api";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string): Socket {
  if (socket && currentToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
