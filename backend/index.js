require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || '').trim();
const SAVE_IMAGES = process.env.SAVE_IMAGES === 'true';
const EMBEDDING_THRESHOLD = parseFloat(process.env.EMBEDDING_THRESHOLD || '0.6');
const REGISTER_FACE_THRESHOLD = parseFloat(process.env.REGISTER_FACE_THRESHOLD || '0.45');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve sample static clients (optional)
// Serve frontend and model assets
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend_client')));
app.use('/models', express.static(path.join(__dirname, '..', 'frontend_client', 'models')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function parseEmbeddingValue(embedding) {
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === 'string' && embedding.trim()) {
    try {
      const parsed = JSON.parse(embedding);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      return null;
    }
  }
  return null;
}

function hashImageDataUrl(image) {
  if (!image || typeof image !== 'string') return null;
  const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
  const data = matches ? matches[2] : image;
  try {
    return crypto.createHash('md5').update(Buffer.from(data, 'base64')).digest('hex');
  } catch (err) {
    return null;
  }
}

function findBestMatch(embedding, cb) {
  db.all('SELECT id, name, face_embedding FROM Users', [], (err, rows) => {
    if (err) return cb(err);
    let best = null;
    rows.forEach(row => {
      try {
        const stored = JSON.parse(row.face_embedding);
        const dist = euclideanDistance(embedding, stored);
        if (!best || dist < best.distance) best = { id: row.id, name: row.name, distance: dist };
      } catch (e) {
        // ignore parse errors
      }
    });
    cb(null, best);
  });
}

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin token is not configured. Please set ADMIN_TOKEN in backend/.env.' });
  }
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/attendance', (req, res) => {
  try {
    const { image, device_id, name, embedding } = req.body;
    const timestamp = new Date().toISOString();

    // If client provides embedding (preferred)
    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      findBestMatch(embedding, (err, best) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'db error' });
        }

        const saveAttendance = (user) => {
          const uploadsDir = path.join(__dirname, 'uploads');
          let fileName = null;
          const uidForFile = (user && user.id) ? user.id : 'unknown';
          // Save image when provided. If embedding was not provided (image-only), always save; otherwise respect SAVE_IMAGES flag
          if (image && (SAVE_IMAGES || !embedding)) {
            try {
              const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
              let data = image;
              let ext = 'jpg';
              if (matches) {
                ext = matches[1].split('/')[1];
                data = matches[2];
              }
              if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
              fileName = `${Date.now()}_${uidForFile}.${ext}`;
              fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(data, 'base64'));
            } catch (e) {
              console.warn('Failed to save image:', e.message);
            }
          }

          const userIdParam = (user && user.id) ? user.id : null;
          db.run('INSERT INTO Attendance (user_id, timestamp, device_id, image_path) VALUES (?, ?, ?, ?)',
            [userIdParam, timestamp, device_id || 'device-unknown', fileName], function (err) {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'db error' });
              }
              // Only emit WebSocket event if matched (user_id exists)
              if (user && user.id) {
                const payload = {
                  user_id: user.id,
                  name: user.name,
                  time: timestamp,
                  device_id: device_id || 'device-unknown',
                  matched: true,
                  distance: best.distance
                };
                if (image && (SAVE_IMAGES || !embedding) && fileName) payload.image = `data:image/*;base64,${fs.readFileSync(path.join(__dirname, 'uploads', fileName)).toString('base64')}`;
                io.emit('attendance', payload);
              }
              res.json({ success: true, attendanceId: this.lastID, user: (user && user.id) ? user : null, matched: best && best.distance <= EMBEDDING_THRESHOLD, distance: best ? best.distance : null });
            });
        };

        if (best && best.distance <= EMBEDDING_THRESHOLD) {
          // matched existing user
          saveAttendance({ id: best.id, name: best.name });
        } else {
          // No match: reject - user not registered
          return res.status(404).json({
            success: false,
            error: 'User not found',
            message: 'Khuôn mặt không được nhận dạng. Vui lòng liên hệ admin để đăng ký.',
            matched: false
          });
        }
      });
    }

    // Fallback: image-only (legacy MD5 behavior)
    if (!embedding) {
      if (!image) return res.status(400).json({ error: 'image or embedding required' });

      const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
      let ext = 'png';
      let data = image;
      if (matches) {
        ext = matches[1].split('/')[1];
        data = matches[2];
      }
      const buffer = Buffer.from(data, 'base64');

      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      db.get('SELECT id, name FROM Users WHERE face_hash = ?', [hash], (err, row) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'db error' });
        }

        const user = row ? { id: row.id, name: row.name } : null;
        if (user) {
          const uploadsDir = path.join(__dirname, 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const fileName = `${Date.now()}_${user.id}.${ext}`;
          fs.writeFileSync(path.join(uploadsDir, fileName), buffer);

          db.run('INSERT INTO Attendance (user_id, timestamp, device_id, image_path) VALUES (?, ?, ?, ?)',
            [user.id, timestamp, device_id || 'device-unknown', fileName], function (err) {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'db error' });
              }
              const payload = {
                name: user.name,
                time: timestamp,
                image: `data:image/${ext};base64,${data}`,
                device_id: device_id || 'device-unknown'
              };
              io.emit('attendance', payload);
              res.json({ success: true, attendanceId: this.lastID, user });
            });
        } else {
          return res.json({ success: true, attendanceId: null, user: null, matched: false, message: 'Unknown face' });
        }
      });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/attendance', (req, res) => {
  let q;
  if (process.env.USE_SQL_SERVER === 'true' || process.env.USE_SQL_SERVER === '1') {
    q = `SELECT TOP (100) Attendance.id, Users.name AS name, Attendance.timestamp, Attendance.device_id, Attendance.image_path
         FROM Attendance LEFT JOIN Users ON Attendance.user_id = Users.id
         ORDER BY Attendance.timestamp DESC`;
  } else {
    q = `SELECT Attendance.id, Users.name AS name, Attendance.timestamp, Attendance.device_id, Attendance.image_path
         FROM Attendance LEFT JOIN Users ON Attendance.user_id = Users.id
         ORDER BY Attendance.timestamp DESC LIMIT 100`;
  }
  db.all(q, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    const result = rows.map(r => ({
      id: r.id,
      name: r.name || 'Unknown',
      time: r.timestamp,
      image: r.image_path ? `/uploads/${r.image_path}` : null,
      device_id: r.device_id
    }));
    res.json(result);
  });
});

// Admin: list users
app.get('/api/users', adminAuth, (req, res) => {
  db.all('SELECT id, name FROM Users ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows);
  });
});

// Admin: create user with embedding
app.post('/api/users', adminAuth, (req, res) => {
  const { name, embedding, image } = req.body;
  const parsedEmbedding = parseEmbeddingValue(embedding);
  if (!name || !parsedEmbedding) return res.status(400).json({ error: 'name and embedding required' });

  db.all('SELECT id, name, face_embedding FROM Users WHERE face_embedding IS NOT NULL', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });

    let best = null;
    rows.forEach(row => {
      try {
        const stored = parseEmbeddingValue(row.face_embedding);
        if (!stored) return;
        const dist = euclideanDistance(parsedEmbedding, stored);
        if (!best || dist < best.distance) best = { id: row.id, name: row.name, distance: dist };
      } catch (e) {
        // ignore broken rows
      }
    });

    const faceMatched = best && best.distance <= REGISTER_FACE_THRESHOLD;
    if (faceMatched) {
      const sameNameExists = rows.some(row => normalizeName(row.name) === normalizeName(name));
      if (sameNameExists) {
        return res.status(409).json({
          error: 'duplicate face and name',
          matchedUser: best,
          distance: best.distance
        });
      }
    }

    const faceHash = image ? hashImageDataUrl(image) : null;
    db.run('INSERT INTO Users (name, face_hash, face_embedding) VALUES (?, ?, ?)', [name, faceHash, JSON.stringify(parsedEmbedding)], function (insertErr) {
      if (insertErr) return res.status(500).json({ error: 'db error' });
      res.json({
        id: this.lastID,
        name,
        face_hash: faceHash,
        has_embedding: true,
        matchedFace: faceMatched,
        matchedUser: faceMatched ? best : null,
        distance: faceMatched ? best.distance : null
      });
    });
  });
});

// Admin: update user
app.put('/api/users/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  const { name, embedding, image } = req.body;
  
  if (!name && !embedding) {
    return res.status(400).json({ error: 'name or embedding required' });
  }

  db.get('SELECT * FROM Users WHERE id = ?', [id], (err, user) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedName = name || user.name;
    const updatedEmbedding = embedding ? parseEmbeddingValue(embedding) : (user.face_embedding ? JSON.parse(user.face_embedding) : null);
    const updatedFaceHash = image ? hashImageDataUrl(image) : user.face_hash;

    db.run(
      'UPDATE Users SET name = ?, face_embedding = ?, face_hash = ? WHERE id = ?',
      [updatedName, updatedEmbedding ? JSON.stringify(updatedEmbedding) : user.face_embedding, updatedFaceHash, id],
      function (err) {
        if (err) return res.status(500).json({ error: 'db error' });
        res.json({
          success: true,
          user_id: id,
          name: updatedName,
          message: 'User updated successfully'
        });
      }
    );
  });
});

// Admin: delete user
app.delete('/api/users/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  // Delete Attendance records first (Foreign Key constraint)
  db.run('DELETE FROM Attendance WHERE user_id = ?', [id], (err1) => {
    if (err1) {
      console.error(err1);
      return res.status(500).json({ error: 'db error' });
    }
    // Then delete User
    db.run('DELETE FROM Users WHERE id = ?', [id], function (err2) {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'db error' });
      }
      res.json({ success: true, deleted: this.changes, message: 'User deleted successfully' });
    });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  return next(err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
