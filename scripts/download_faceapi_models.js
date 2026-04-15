// Simple Node script to download face-api.js models into frontend_client/models
const https = require('https');
const fs = require('fs');
const path = require('path');

const base = 'https://justadudewhohacks.github.io/face-api.js/models';
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1'
];

const outDir = path.join(__dirname, '..', 'frontend_client', 'models');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(file) {
  const url = `${base}/${file}`;
  const ext = path.extname(file) || '';
  const out = path.join(outDir, file + (ext ? '' : ''));
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(out);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed ' + url + ' ' + res.statusCode));
      res.pipe(f);
      f.on('finish', () => { f.close(() => resolve(out)); });
    }).on('error', reject);
  });
}

(async () => {
  try {
    for (const f of files) {
      console.log('Downloading', f);
      await download(f);
    }
    console.log('All downloaded to', outDir);
  } catch (e) { console.error('Download error', e); process.exit(1); }
})();
