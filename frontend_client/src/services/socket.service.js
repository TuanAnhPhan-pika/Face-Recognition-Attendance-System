import { io } from "socket.io-client";

export function connectAttendanceSocket(backend, { onConnect, onDisconnect, onAttendance } = {}) {
  const socket = io(backend);

  if (onConnect) socket.on("connect", () => onConnect(socket));
  if (onDisconnect) socket.on("disconnect", onDisconnect);
  if (onAttendance) socket.on("attendance", onAttendance);

  return socket;
}
