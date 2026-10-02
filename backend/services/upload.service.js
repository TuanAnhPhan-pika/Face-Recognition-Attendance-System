const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

function parseImageDataUrl(image, defaultExt) {
  const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
  let data = image;
  let ext = defaultExt;

  if (matches) {
    ext = matches[1].split('/')[1];
    data = matches[2];
  }

  return { data, ext };
}

function saveImageDataUrl(image, userId, defaultExt) {
  const { data, ext } = parseImageDataUrl(image, defaultExt);
  ensureUploadsDir();
  const fileName = `${Date.now()}_${userId}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  return { fileName, filePath, data, ext };
}

function readUploadAsBase64(fileName) {
  return fs.readFileSync(path.join(uploadsDir, fileName)).toString('base64');
}

module.exports = {
  uploadsDir,
  parseImageDataUrl,
  saveImageDataUrl,
  readUploadAsBase64
};
