const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  examTitle: { type: String, default: '' },
  type: {
    type: String,
    enum: ['login', 'logout', 'exam_start', 'exam_end', 'violation', 'otp_verified', 'face_verified'],
    required: true
  },
  message: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
