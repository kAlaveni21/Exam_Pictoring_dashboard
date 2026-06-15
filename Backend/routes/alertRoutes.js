const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const ActivityLog = require('../models/ActivityLog');
const { verifyToken, isAdmin } = require('../middleware/auth');

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';

// Get all alerts (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { limit = 50, examId } = req.query;
    const filter = {};
    if (examId) filter.examId = examId;

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'name email')
      .populate('examId', 'title');

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts.' });
  }
});

// Get alert stats (admin only)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const alertsByType = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const alertsBySeverity = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const recentAlerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'name email');

    res.json({
      totalAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alert stats.' });
  }
});

// Create alert (from student client)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { examId, examTitle, type, message, screenshot, severity, deviceInfo = {} } = req.body;

    const alert = new Alert({
      studentId: req.user.id,
      studentName: req.user.name,
      examId,
      examTitle,
      type,
      message,
      screenshot,
      severity,
      deviceInfo: {
        ...deviceInfo,
        ipAddress: deviceInfo.ipAddress || getClientIp(req),
        userAgent: req.headers['user-agent'] || deviceInfo.userAgent || ''
      }
    });

    await alert.save();
    await ActivityLog.create({
      studentId: req.user.id,
      studentName: req.user.name,
      examId,
      examTitle,
      type: 'violation',
      message,
      metadata: { violationType: type, severity }
    });

    // Emit the alert via Socket.IO (attached to req in server.js)
    if (req.app.get('io')) {
      req.app.get('io').emit('new-alert', {
        _id: alert._id,
        studentId: req.user.id,
        studentName: req.user.name,
        examId,
        examTitle,
        type,
        message,
        severity,
        deviceInfo: alert.deviceInfo,
        createdAt: alert.createdAt
      });
    }

    res.status(201).json({ message: 'Alert recorded.' });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Error creating alert.' });
  }
});

module.exports = router;
