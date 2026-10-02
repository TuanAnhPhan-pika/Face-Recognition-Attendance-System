require('dotenv').config();

const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || '').trim();
const SAVE_IMAGES = process.env.SAVE_IMAGES === 'true';
const EMBEDDING_THRESHOLD = parseFloat(process.env.EMBEDDING_THRESHOLD || '0.6');
const REGISTER_FACE_THRESHOLD = parseFloat(process.env.REGISTER_FACE_THRESHOLD || '0.45');
const USE_SQL_SERVER = process.env.USE_SQL_SERVER === 'true' || process.env.USE_SQL_SERVER === '1';
const PORT = process.env.PORT || 3000;

module.exports = {
  ADMIN_TOKEN,
  SAVE_IMAGES,
  EMBEDDING_THRESHOLD,
  REGISTER_FACE_THRESHOLD,
  USE_SQL_SERVER,
  PORT
};
