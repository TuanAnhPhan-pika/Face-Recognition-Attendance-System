const express = require('express');
const attendanceController = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/', attendanceController.createAttendance);
router.get('/', attendanceController.listAttendance);

module.exports = router;
