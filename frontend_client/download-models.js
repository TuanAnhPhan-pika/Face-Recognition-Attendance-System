// File: download-models.js
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Trong ES Module không có sẵn biến __dirname, chúng ta phải tự tạo lại nó
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const base = 'https://justadudewhohacks.github.io/face-api.js/models';
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2', 
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1'
];

// Đường dẫn trỏ thẳng vào thư mục public/models
const outDir = path.join(__dirname, 'public', 'models'); 

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function download(file) {
  const url = `${base}/${file}`;
  const out = path.join(outDir, file);
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(out);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
          return reject(new Error(`Thất bại: ${url} (Mã lỗi: ${res.statusCode})`));
      }
      res.pipe(f);
      f.on('finish', () => { 
          f.close(() => resolve(out)); 
      });
    }).on('error', reject);
  });
}

// Chạy hàm bất đồng bộ
await (async () => {
  console.log('⏳ Bắt đầu kiểm tra và tải mô hình AI...');
  try {
    for (const f of files) {
      const filePath = path.join(outDir, f);
      if (!fs.existsSync(filePath)) {
          console.log(` ⬇️ Đang tải: ${f}`);
          await download(f);
      } else {
          console.log(` ✅ Đã có sẵn: ${f}`);
      }
    }
    console.log('🎉 Hoàn tất! Tất cả model đã nằm trong thư mục public/models');
  } catch (e) { 
    console.error('❌ Lỗi quá trình tải:', e); 
    process.exit(1); 
  }
})();