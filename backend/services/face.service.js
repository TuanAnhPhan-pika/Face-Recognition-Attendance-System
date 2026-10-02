const db = require('../config/db');
const { euclideanDistance } = require('../utils/distance');
const { parseEmbeddingValue } = require('../utils/face');
const { hashImageDataUrl } = require('../utils/hash');

function findBestEmbeddingMatch(embedding, excludeUserId, cb) {
  const query = excludeUserId
    ? 'SELECT id, name, face_embedding FROM Users WHERE face_embedding IS NOT NULL AND id <> ?'
    : 'SELECT id, name, face_embedding FROM Users WHERE face_embedding IS NOT NULL';
  const params = excludeUserId ? [excludeUserId] : [];

  db.all(query, params, (err, rows) => {
    if (err) return cb(err);
    let best = null;
    rows.forEach(row => {
      try {
        const stored = parseEmbeddingValue(row.face_embedding);
        if (!stored) return;
        const dist = euclideanDistance(embedding, stored);
        if (!best || dist < best.distance) best = { id: row.id, name: row.name, distance: dist };
      } catch (e) {
        // ignore broken rows
      }
    });
    cb(null, best);
  });
}

function findBestMatch(embedding, cb) {
  findBestEmbeddingMatch(embedding, null, cb);
}

function findBestEmbeddingMatchAsync(embedding, excludeUserId) {
  return new Promise((resolve, reject) => {
    findBestEmbeddingMatch(embedding, excludeUserId, (err, best) => {
      if (err) return reject(err);
      resolve(best);
    });
  });
}

function findBestMatchAsync(embedding) {
  return findBestEmbeddingMatchAsync(embedding, null);
}

module.exports = {
  euclideanDistance,
  parseEmbeddingValue,
  hashImageDataUrl,
  findBestEmbeddingMatch,
  findBestMatch,
  findBestEmbeddingMatchAsync,
  findBestMatchAsync
};
