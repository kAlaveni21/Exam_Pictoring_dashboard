const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  designation: {
    type: String,
    trim: true,
    default: ''
  },
  course: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  profilePhoto: {
    type: String,
    trim: true,
    default: ''
  },
  badges: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    awardedAt: { type: Date, default: Date.now }
  }],
  performanceInsights: {
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
    suggestedImprovements: [{ type: String }],
    summary: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
