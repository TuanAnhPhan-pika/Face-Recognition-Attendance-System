const { ADMIN_TOKEN } = require('../config/env');

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin token is not configured. Please set ADMIN_TOKEN in backend/.env.' });
  }
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

module.exports = {
  adminAuth
};
