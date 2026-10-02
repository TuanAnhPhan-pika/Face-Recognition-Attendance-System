const crypto = require('crypto');
const db = require('../config/db');
const { EMBEDDING_THRESHOLD, SAVE_IMAGES, USE_SQL_SERVER } = require('../config/env');
const { emitAttendance } = require('../config/socket');
const faceService = require('./face.service');
const uploadService = require('./upload.service');
const {
  getVietnamTimestamp,
  getVietnamDate,
  formatTimestampForResponse
} = require('../utils/time');

function markDbError(err) {
  if (err) err.isDbError = true;
  return err;
}

function dbAll(sqlQuery, params) {
  return new Promise((resolve, reject) => {
    db.all(sqlQuery, params, (err, rows) => {
      if (err) return reject(markDbError(err));
      resolve(rows);
    });
  });
}

function dbGet(sqlQuery, params) {
  return new Promise((resolve, reject) => {
    db.get(sqlQuery, params, (err, row) => {
      if (err) return reject(markDbError(err));
      resolve(row);
    });
  });
}

function insertAttendanceOncePerDay(userId, timestamp, dateStr, deviceId, imagePath, cb) {
  if (!userId) return cb(null, { inserted: false, attendanceId: null });

  const device = deviceId || 'device-unknown';
  const sqlQuery = USE_SQL_SERVER
    ? `INSERT INTO Attendance (user_id, timestamp, device_id, image_path)
       OUTPUT INSERTED.id
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM Attendance WHERE user_id = ? AND CONVERT(date, timestamp) = ?
       )`
    : `INSERT INTO Attendance (user_id, timestamp, device_id, image_path)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM Attendance WHERE user_id = ? AND substr(timestamp, 1, 10) = ?
       )`;

  db.run(sqlQuery, [userId, timestamp, device, imagePath || null, userId, dateStr], function (err) {
    if (err) return cb(err);
    const changed = Number(this && this.changes ? this.changes : 0);
    cb(null, {
      inserted: changed > 0,
      attendanceId: this && this.lastID ? this.lastID : null
    });
  });
}

function insertAttendanceOncePerDayAsync(userId, timestamp, dateStr, deviceId, imagePath) {
  return new Promise((resolve, reject) => {
    insertAttendanceOncePerDay(userId, timestamp, dateStr, deviceId, imagePath, (err, result) => {
      if (err) return reject(markDbError(err));
      resolve(result);
    });
  });
}

async function saveMatchedAttendance({ user, best, image, embedding, deviceId, timestamp, attendanceDate }) {
  const userIdParam = (user && user.id) ? user.id : null;
  let fileName = null;
  const uidForFile = (user && user.id) ? user.id : 'unknown';

  // Save image when provided. If embedding was not provided (image-only), always save; otherwise respect SAVE_IMAGES flag
  if (image && (SAVE_IMAGES || !embedding)) {
    try {
      const savedImage = uploadService.saveImageDataUrl(image, uidForFile, 'jpg');
      fileName = savedImage.fileName;
    } catch (e) {
      console.warn('Failed to save image:', e.message);
    }
  }

  const insertResult = await insertAttendanceOncePerDayAsync(userIdParam, timestamp, attendanceDate, deviceId, fileName);

  if (!insertResult.inserted) {
    if (user && user.id) {
      emitAttendance({
        user_id: user.id,
        name: user.name,
        time: timestamp,
        device_id: deviceId || 'device-unknown',
        matched: true,
        distance: best ? best.distance : null,
        duplicate: true,
        message: 'Người dùng đã điểm danh hôm nay.'
      });
    }
    return {
      success: true,
      attendanceId: null,
      user: user && user.id ? user : null,
      matched: true,
      distance: best ? best.distance : null,
      duplicate: true,
      message: 'Người dùng đã điểm danh hôm nay.'
    };
  }

  // Only emit WebSocket event if matched (user_id exists)
  if (user && user.id) {
    const payload = {
      user_id: user.id,
      name: user.name,
      time: timestamp,
      device_id: deviceId || 'device-unknown',
      matched: true,
      distance: best.distance
    };
    if (image && (SAVE_IMAGES || !embedding) && fileName) {
      payload.image = `data:image/*;base64,${uploadService.readUploadAsBase64(fileName)}`;
    }
    emitAttendance(payload);
  }

  return {
    success: true,
    attendanceId: insertResult.attendanceId,
    user: (user && user.id) ? user : null,
    matched: best && best.distance <= EMBEDDING_THRESHOLD,
    distance: best ? best.distance : null
  };
}

async function recordAttendance(body) {
  const { image, device_id, embedding } = body;
  const timestamp = getVietnamTimestamp();
  const attendanceDate = getVietnamDate();

  // If client provides embedding (preferred)
  if (embedding && Array.isArray(embedding) && embedding.length > 0) {
    const best = await faceService.findBestMatchAsync(embedding).catch((err) => {
      throw markDbError(err);
    });

    if (best && best.distance <= EMBEDDING_THRESHOLD) {
      // matched existing user
      const body = await saveMatchedAttendance({
        user: { id: best.id, name: best.name },
        best,
        image,
        embedding,
        deviceId: device_id,
        timestamp,
        attendanceDate
      });
      return { status: 200, body };
    }

    // No match: reject - user not registered
    return {
      status: 404,
      body: {
        success: false,
        error: 'User not found',
        message: 'Khuôn mặt không được nhận dạng. Vui lòng liên hệ admin để đăng ký.',
        matched: false
      }
    };
  }

  // Fallback: image-only (legacy MD5 behavior)
  if (!embedding) {
    if (!image) return { status: 400, body: { error: 'image or embedding required' } };

    const { data, ext } = uploadService.parseImageDataUrl(image, 'png');
    const buffer = Buffer.from(data, 'base64');
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const row = await dbGet('SELECT id, name FROM Users WHERE face_hash = ?', [hash]);
    const user = row ? { id: row.id, name: row.name } : null;

    if (user) {
      const savedImage = uploadService.saveImageDataUrl(image, user.id, 'png');
      const insertResult = await insertAttendanceOncePerDayAsync(user.id, timestamp, attendanceDate, device_id, savedImage.fileName);

      if (!insertResult.inserted) {
        emitAttendance({
          user_id: user.id,
          name: user.name,
          time: timestamp,
          device_id: device_id || 'device-unknown',
          matched: true,
          duplicate: true,
          message: 'Người dùng đã điểm danh hôm nay.'
        });
        return {
          status: 200,
          body: {
            success: true,
            attendanceId: null,
            user,
            matched: true,
            duplicate: true,
            message: 'Người dùng đã điểm danh hôm nay.'
          }
        };
      }

      const payload = {
        user_id: user.id,
        name: user.name,
        time: timestamp,
        image: `data:image/${ext};base64,${data}`,
        device_id: device_id || 'device-unknown'
      };
      emitAttendance(payload);
      return { status: 200, body: { success: true, attendanceId: insertResult.attendanceId, user } };
    }

    return {
      status: 200,
      body: { success: true, attendanceId: null, user: null, matched: false, message: 'Unknown face' }
    };
  }

  return { status: 400, body: { error: 'image or embedding required' } };
}

async function listAttendance() {
  let q;
  if (USE_SQL_SERVER) {
    q = `SELECT TOP (100) Attendance.id, Attendance.user_id, Users.name AS name, Attendance.timestamp, Attendance.device_id, Attendance.image_path
         FROM Attendance LEFT JOIN Users ON Attendance.user_id = Users.id
         ORDER BY Attendance.timestamp DESC`;
  } else {
    q = `SELECT Attendance.id, Attendance.user_id, Users.name AS name, Attendance.timestamp, Attendance.device_id, Attendance.image_path
         FROM Attendance LEFT JOIN Users ON Attendance.user_id = Users.id
         ORDER BY Attendance.timestamp DESC LIMIT 100`;
  }

  const rows = await dbAll(q, []);
  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name || 'Unknown',
    time: formatTimestampForResponse(r.timestamp),
    image: r.image_path ? `/uploads/${r.image_path}` : null,
    device_id: r.device_id
  }));
}

module.exports = {
  insertAttendanceOncePerDay,
  recordAttendance,
  listAttendance
};
