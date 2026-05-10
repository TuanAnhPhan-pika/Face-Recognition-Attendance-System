const http = require('http');
const app = require('./app');
const db = require('./config/db');
const { PORT } = require('./config/env');
const { initializeSocket } = require('./config/socket');

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  const dbInfo = db.__dbInfo;
  if (!dbInfo) {
    console.log('[DB] Unknown database adapter');
    return;
  }

  if (dbInfo.type === 'SQLite') {
    console.log(`[DB] Connected: SQLite (${dbInfo.path})`);
    return;
  }

  console.log(`[DB] Connecting: ${dbInfo.type} ${dbInfo.server}/${dbInfo.database}`);
  dbInfo.ready
    .then((info) => {
      console.log(`[DB] Connected: ${info.type} ${info.server}/${info.database}`);
    })
    .catch((err) => {
      const message = err && err.message ? err.message : String(err);
      console.error(`[DB] Connection failed: ${message}`);
    });
});

module.exports = server;
