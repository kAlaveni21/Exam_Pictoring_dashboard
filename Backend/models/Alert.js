const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examTitle: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['no_face', 'multiple_faces', 'looking_away', 'tab_switch'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  screenshot: {
    type: String, // base64 encoded screenshot
    default: ''
  },
  deviceInfo: {
    browser: { type: String, default: '' },
    operatingSystem: { type: String, default: '' },
    deviceType: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
