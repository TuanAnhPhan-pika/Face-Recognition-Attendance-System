const express = require('express');
const path = require('path');
const cors = require('cors');
require('./config/env');

const attendanceRoutes = require('./routes/attendance.routes');
const usersRoutes = require('./routes/users.routes');
const adminRoutes = require('./routes/admin.routes');
const { invalidJsonErrorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve frontend and model assets
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend_client')));
app.use('/models', express.static(path.join(__dirname, '..', 'frontend_client', 'models')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

app.use(invalidJsonErrorHandler);

module.exports = app;
