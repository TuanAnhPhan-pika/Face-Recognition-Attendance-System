const attendanceService = require('../services/attendance.service');

async function createAttendance(req, res) {
  try {
    const result = await attendanceService.recordAttendance(req.body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    if (err && err.isDbError) return res.status(500).json({ error: 'db error' });
    return res.status(500).json({ error: 'server error' });
  }
}

async function listAttendance(req, res) {
  try {
    const result = await attendanceService.listAttendance();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'db error' });
  }
}

module.exports = {
  createAttendance,
  listAttendance
};
