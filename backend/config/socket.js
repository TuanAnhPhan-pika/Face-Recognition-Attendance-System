const { Server } = require('socket.io');

let io = null;

function initializeSocket(server) {
  io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
  });

  return io;
}

function getIO() {
  return io;
}

function emitAttendance(payload) {
  if (io) io.emit('attendance', payload);
}

module.exports = {
  initializeSocket,
  getIO,
  emitAttendance
};
