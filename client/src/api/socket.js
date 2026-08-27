import { io } from "socket.io-client";

// Derive the socket endpoint from the same backend the HTTP API uses, so
// realtime tracks whichever server is serving the app (dev or hosted).
const API_BASE = import.meta.env.VITE_API_URL || "https://ai-smart-notes-b.onrender.com/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE.replace(/\/api$/, "");

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true, reconnection: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;