const path = require('path');
const USE_SQL_SERVER = (process.env.USE_SQL_SERVER === 'true' || process.env.USE_SQL_SERVER === '1');

if (!USE_SQL_SERVER) {
  // Fallback to SQLite (default demo)
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'data.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        face_hash TEXT,
        face_embedding TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp TEXT,
        device_id TEXT,
        image_path TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(id)
      )
    `);

    // For older DBs: add face_embedding column if missing
    db.all("PRAGMA table_info('Users')", [], (err, rows) => {
      if (!err && rows && !rows.find(r => r.name === 'face_embedding')) {
        db.run("ALTER TABLE Users ADD COLUMN face_embedding TEXT");
      }
    });
  });

  module.exports = db;
} else {
  // SQL Server implementation that exposes sqlite-like API: all/get/run(callback)
  const sql = require('mssql');

  const config = {
    user: process.env.MSSQL_USER || process.env.SQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || process.env.SQL_PASSWORD || '',
    server: process.env.MSSQL_SERVER || process.env.SQL_SERVER || 'localhost',
    database: process.env.MSSQL_DATABASE || process.env.SQL_DATABASE || 'fra_db',
    port: parseInt(process.env.MSSQL_PORT || process.env.SQL_PORT || '1433', 10),
    options: {
      encrypt: (process.env.MSSQL_ENCRYPT === 'true'),
      trustServerCertificate: (process.env.MSSQL_TRUST === 'true' || process.env.MSSQL_TRUST === undefined)
    }
  };

  const poolPromise = new sql.ConnectionPool(config).connect();

  function replacePlaceholders(q) {
    let idx = 0;
    const text = q.replace(/\?/g, () => '@p' + (++idx));
    return { text, count: idx };
  }

  async function ensureSchema() {
    const pool = await poolPromise;
    const createUsers = `IF OBJECT_ID('dbo.Users','U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200),
        face_hash NVARCHAR(255),
        face_embedding NVARCHAR(MAX)
      );
    END`;

    const createAttendance = `IF OBJECT_ID('dbo.Attendance','U') IS NULL
    BEGIN
      CREATE TABLE dbo.Attendance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        timestamp DATETIME2,
        device_id NVARCHAR(200),
        image_path NVARCHAR(500),
        CONSTRAINT FK_Attendance_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(id)
      );
    END`;

    await pool.request().query(createUsers);
    await pool.request().query(createAttendance);

    // Ensure face_embedding column exists (for older schemas)
    const colCheck = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='face_embedding'");
    if (!colCheck.recordset || colCheck.recordset.length === 0) {
      await pool.request().query("ALTER TABLE dbo.Users ADD face_embedding NVARCHAR(MAX)");
    }
  }

  // Initialize schema (fire-and-forget)
  ensureSchema().catch(err => console.error('MSSQL schema init error', err));

  const db = {
    all: async function(sqlQuery, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      try {
        const pool = await poolPromise;
        const { text, count } = replacePlaceholders(sqlQuery);
        const request = pool.request();
        for (let i = 1; i <= count; i++) request.input('p' + i, sql.NVarChar(sql.MAX), (params && params[i-1] != null) ? params[i-1].toString() : null);
        const result = await request.query(text);
        cb(null, result.recordset || []);
      } catch (err) { cb(err); }
    },
    get: async function(sqlQuery, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      try {
        const pool = await poolPromise;
        const { text, count } = replacePlaceholders(sqlQuery);
        const request = pool.request();
        for (let i = 1; i <= count; i++) request.input('p' + i, sql.NVarChar(sql.MAX), (params && params[i-1] != null) ? params[i-1].toString() : null);
        const result = await request.query(text);
        cb(null, (result.recordset && result.recordset[0]) ? result.recordset[0] : null);
      } catch (err) { cb(err); }
    },
    run: async function(sqlQuery, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      try {
        const pool = await poolPromise;
        const isInsert = /^\s*INSERT\b/i.test(sqlQuery);
        let { text, count } = replacePlaceholders(sqlQuery);
        if (isInsert) text = text + '; SELECT SCOPE_IDENTITY() AS id;';
        const request = pool.request();
        for (let i = 1; i <= count; i++) request.input('p' + i, sql.NVarChar(sql.MAX), (params && params[i-1] != null) ? params[i-1].toString() : null);
        const result = await request.query(text);
        const ctx = {};
        if (isInsert && result.recordset && result.recordset[0]) {
          const idVal = result.recordset[0].id || Object.values(result.recordset[0])[0];
          ctx.lastID = Number(idVal);
        }
        ctx.changes = result.rowsAffected ? result.rowsAffected.reduce((a,b)=>a+b,0) : 0;
        cb.call(ctx, null);
      } catch (err) { cb(err); }
    }
  };

  module.exports = db;
}
