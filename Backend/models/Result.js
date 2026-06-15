const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  questionText: { type: String, default: '' },
  selectedAnswer: { type: Number, default: null },
  correctAnswer: { type: Number, default: null },
  isCorrect: { type: Boolean, default: false },
  topic: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
}, { _id: false });

const deviceInfoSchema = new mongoose.Schema({
  browser: { type: String, default: '' },
  operatingSystem: { type: String, default: '' },
  deviceType: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  examTitle: { type: String, default: '' },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  answers: [answerSchema],
  deviceInfo: deviceInfoSchema,
  startedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
