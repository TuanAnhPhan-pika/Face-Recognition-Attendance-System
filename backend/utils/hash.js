const crypto = require('crypto');

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

module.exports = {
  hashImageDataUrl
};
