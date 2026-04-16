# Node.js Requirements - Backend Dependencies

This file documents all Node.js packages required for the backend Express server.

## Quick Install

```bash
cd backend
npm install
```

This will install all packages listed in `backend/package.json` automatically.

## Dependencies List

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web framework and HTTP server |
| `socket.io` | ^4.7.1 | Real-time WebSocket communication for live updates |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.0.3 | Environment variables loader |
| `sqlite3` | ^5.1.6 | SQLite database driver (default) |
| `mssql` | ^9.3.2 | SQL Server database driver (optional) |
| `msnodesqlv8` | ^5.1.9 | SQL Server native driver (optional) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^2.0.22 | Auto-restart server on file changes (development only) |

## Installation Methods

### Method 1: Standard Install (Recommended)

```bash
cd backend
npm install
```

This reads `package.json` and installs all dependencies with locked versions from `package-lock.json`.

### Method 2: Install with Specific Versions

If you need to reinstall fresh:

```bash
cd backend
npm install express@4.18.2 socket.io@4.7.1 cors@2.8.5 dotenv@16.0.3 sqlite3@5.1.6 mssql@9.3.2 msnodesqlv8@5.1.9
npm install --save-dev nodemon@2.0.22
```

### Method 3: Using npm ci (for production)

```bash
cd backend
npm ci
```

This uses `package-lock.json` for exact reproducible installs.

## Running the Backend

### Development (with auto-reload)

```bash
cd backend
npm run dev
```

This uses `nodemon` to watch for file changes and automatically restart the server.

### Production

```bash
cd backend
npm start
```

This runs `node index.js` directly.

## Database Configuration

Before running, configure `backend/.env`:

- **SQLite** (Default): No additional setup. Database file: `backend/data.sqlite`
- **SQL Server**: 
  - Set `USE_SQL_SERVER=true` in `.env`
  - Configure `MSSQL_SERVER`, `MSSQL_DATABASE`, credentials
  - See `docs/sql_server_setup.md` for database creation

## Troubleshooting

### npm install errors

- **Windows**: May need Visual C++ Build Tools for some native packages
  - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  
- **node-gyp errors**: Try rebuilding
  ```bash
  npm rebuild
  ```

### Port already in use

If port 3000 is already in use:

```bash
# Change PORT in backend/.env
PORT=3001
```

### Missing modules

If you get "Cannot find module" errors after pulling code:

```bash
rm -rf node_modules package-lock.json
npm install
```

### nodemon not found (development)

```bash
npm install --save-dev nodemon
```

## Size Reference

- `node_modules/` directory size: ~200-300 MB
- Installation time: 2-5 minutes (depends on internet speed)

## Next Steps

1. Configure `backend/.env` (copy from `.env.example`)
2. Download face-api.js models (see main `requirements.txt`)
3. Run backend: `npm run dev`
4. Open frontend in browser: `frontend_client/index.html`

