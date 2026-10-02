const db = require('../config/db');
const { REGISTER_FACE_THRESHOLD } = require('../config/env');
const faceService = require('./face.service');

function serviceError(statusCode, payload) {
  const err = new Error(payload && payload.error ? payload.error : 'Request failed');
  err.statusCode = statusCode;
  err.payload = payload;
  return err;
}

function dbAll(sqlQuery, params) {
  return new Promise((resolve, reject) => {
    db.all(sqlQuery, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(sqlQuery, params) {
  return new Promise((resolve, reject) => {
    db.get(sqlQuery, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(sqlQuery, params) {
  return new Promise((resolve, reject) => {
    db.run(sqlQuery, params, function (err) {
      if (err) return reject(err);
      resolve({
        lastID: this && this.lastID ? this.lastID : null,
        changes: this && this.changes ? this.changes : 0
      });
    });
  });
}

async function listUsers() {
  return dbAll('SELECT id, name, CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END AS has_face FROM Users ORDER BY id', []);
}

async function createUser(body) {
  const { name } = body;
  const trimmedName = String(name || '').trim();

  if (!trimmedName) throw serviceError(400, { error: 'name required' });

  const result = await dbRun('INSERT INTO Users (name, face_hash, face_embedding) VALUES (?, NULL, NULL)', [trimmedName]);
  return {
    id: result.lastID,
    name: trimmedName,
    face_hash: null,
    face_embedding: null,
    has_embedding: false,
    has_face: false
  };
}

async function addFace(userId, body) {
  const id = Number.parseInt(userId, 10);
  const { embedding, image } = body;
  const parsedEmbedding = faceService.parseEmbeddingValue(embedding);
  const faceHash = faceService.hashImageDataUrl(image);

  if (Number.isNaN(id)) {
    throw serviceError(400, { error: 'invalid user id' });
  }

  if (!parsedEmbedding || !image || !faceHash) {
    throw serviceError(400, { error: 'image and embedding required' });
  }

  const user = await dbGet('SELECT id, name, face_embedding FROM Users WHERE id = ?', [id]);
  if (!user) throw serviceError(404, { error: 'User not found' });

  const best = await faceService.findBestEmbeddingMatchAsync(parsedEmbedding, id);
  const faceMatched = best && best.distance <= REGISTER_FACE_THRESHOLD;
  if (faceMatched) {
    throw serviceError(409, {
      error: 'đã tồn tại khuôn mặt tương tự ở nhân viên có mã số ' + best.id,
      matchedUser: best,
      distance: best.distance
    });
  }

  await dbRun(
    'UPDATE Users SET face_hash = ?, face_embedding = ? WHERE id = ?',
    [faceHash, JSON.stringify(parsedEmbedding), id]
  );

  return {
    success: true,
    user_id: id,
    name: user.name,
    face_hash: faceHash,
    has_embedding: true,
    message: 'Face added successfully'
  };
}

async function updateUser(userId, body) {
  const id = userId;
  const { name, embedding, image } = body;

  if (!name && !embedding) {
    throw serviceError(400, { error: 'name or embedding required' });
  }

  const user = await dbGet('SELECT * FROM Users WHERE id = ?', [id]);
  if (!user) throw serviceError(404, { error: 'User not found' });

  const updatedName = name || user.name;
  const updatedEmbedding = embedding ? faceService.parseEmbeddingValue(embedding) : (user.face_embedding ? JSON.parse(user.face_embedding) : null);
  const updatedFaceHash = image ? faceService.hashImageDataUrl(image) : user.face_hash;

  await dbRun(
    'UPDATE Users SET name = ?, face_embedding = ?, face_hash = ? WHERE id = ?',
    [updatedName, updatedEmbedding ? JSON.stringify(updatedEmbedding) : user.face_embedding, updatedFaceHash, id]
  );

  return {
    success: true,
    user_id: id,
    name: updatedName,
    message: 'User updated successfully'
  };
}

async function deleteUser(userId) {
  const id = userId;
  // Delete Attendance records first (Foreign Key constraint)
  await dbRun('DELETE FROM Attendance WHERE user_id = ?', [id]);
  // Then delete User
  const result = await dbRun('DELETE FROM Users WHERE id = ?', [id]);
  return { success: true, deleted: result.changes, message: 'User deleted successfully' };
}

module.exports = {
  listUsers,
  createUser,
  addFace,
  updateUser,
  deleteUser
};
