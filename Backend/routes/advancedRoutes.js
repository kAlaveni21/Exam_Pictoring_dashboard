const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Result = require('../models/Result');
const ActivityLog = require('../models/ActivityLog');
const Otp = require('../models/Otp');

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ].join('\n');
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const buildExcelHtml = (rows, title) => {
  const headers = Object.keys(rows[0] || { Message: 'No data available' });
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><h1>${escapeHtml(title)}</h1><table border="1"><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
};

const pdfEscape = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildSimplePdf = (rows, title) => {
  const headers = Object.keys(rows[0] || { Message: 'No data available' });
  const lines = [
    title,
    headers.join(' | '),
    ...rows.slice(0, 40).map(row => headers.map(header => row[header]).join(' | '))
  ].map(line => pdfEscape(String(line).slice(0, 120)));

  const stream = [
    'BT',
    '/F1 14 Tf',
    '50 790 Td',
    `(${lines[0] || title}) Tj`,
    '/F1 8 Tf',
    ...lines.slice(1).flatMap(line => ['0 -14 Td', `(${line}) Tj`]),
    'ET'
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';

router.get('/calendar', verifyToken, isAdmin, async (req, res) => {
  const exams = await Exam.find({ isActive: true }).select('title description duration startTime endTime assignedStudents');
  res.json(exams);
});

router.get('/leaderboard', verifyToken, isAdmin, async (req, res) => {
  const grouped = await Result.aggregate([
    {
      $group: {
        _id: '$studentId',
        studentName: { $first: '$studentName' },
        examCount: { $sum: 1 },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' }
      }
    },
    { $sort: { averagePercentage: -1, examCount: -1 } },
    { $limit: 20 }
  ]);

  res.json(grouped.map((row, index) => ({
    rank: index + 1,
    studentId: row._id,
    studentName: row.studentName || 'Student',
    examCount: row.examCount,
    averageScore: Number(row.averageScore || 0).toFixed(1),
    percentage: Math.round(row.averagePercentage || 0)
  })));
});

router.get('/question-analysis', verifyToken, isAdmin, async (req, res) => {
  const results = await Result.find({});
  const questionMap = {};

  results.forEach((result) => {
    result.answers.forEach((answer) => {
      const key = String(answer.questionId || answer.questionText);
      if (!questionMap[key]) {
        questionMap[key] = {
          question: answer.questionText,
          topic: answer.topic || 'General',
          difficulty: answer.difficulty || 'medium',
          correct: 0,
          incorrect: 0,
          total: 0
        };
      }
      questionMap[key].total += 1;
      if (answer.isCorrect) questionMap[key].correct += 1;
      else questionMap[key].incorrect += 1;
    });
  });

  const rows = Object.values(questionMap).map(row => ({
    ...row,
    accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0
  }));

  res.json({
    mostCorrect: [...rows].sort((a, b) => b.correct - a.correct).slice(0, 8),
    mostIncorrect: [...rows].sort((a, b) => b.incorrect - a.incorrect).slice(0, 8),
    difficulty: ['easy', 'medium', 'hard'].map(level => ({
      level,
      count: rows.filter(row => row.difficulty === level).length,
      accuracy: Math.round(
        rows
          .filter(row => row.difficulty === level)
          .reduce((sum, row, _, arr) => sum + row.accuracy / Math.max(arr.length, 1), 0)
      )
    })),
    questions: rows
  });
});

router.get('/activity-logs', verifyToken, isAdmin, async (req, res) => {
  const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

router.post('/activity-logs', verifyToken, async (req, res) => {
  const log = await ActivityLog.create({
    studentId: req.user.id,
    studentName: req.user.name,
    examId: req.body.examId || null,
    examTitle: req.body.examTitle || '',
    type: req.body.type,
    message: req.body.message || '',
    metadata: req.body.metadata || {}
  });
  res.status(201).json(log);
});

router.post('/otp/request', verifyToken, async (req, res) => {
  const { examId } = req.body;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await Otp.deleteMany({ userId: req.user.id, examId });
  await Otp.create({
    userId: req.user.id,
    examId,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  console.log(`Exam OTP for ${req.user.email || req.user.name}: ${code}`);
  res.json({ message: 'OTP generated. In development, use the returned code.', otp: code, expiresInSeconds: 300 });
});

router.post('/otp/verify', verifyToken, async (req, res) => {
  const { examId, code } = req.body;
  const otp = await Otp.findOne({ userId: req.user.id, examId, code, expiresAt: { $gt: new Date() } });
  if (!otp) return res.status(400).json({ verified: false, message: 'Invalid or expired OTP.' });

  otp.verified = true;
  await otp.save();
  await ActivityLog.create({
    studentId: req.user.id,
    studentName: req.user.name,
    examId,
    type: 'otp_verified',
    message: 'OTP verified before exam access.'
  });
  res.json({ verified: true, message: 'OTP verified successfully.' });
});

router.post('/face-verification', verifyToken, async (req, res) => {
  const { examId, examTitle, faceDetected, confidence } = req.body;
  const user = await User.findById(req.user.id).select('profilePhoto name');
  const hasProfilePhoto = Boolean(user?.profilePhoto);
  const verified = Boolean(faceDetected && confidence >= 0.3);

  await ActivityLog.create({
    studentId: req.user.id,
    studentName: req.user.name,
    examId,
    examTitle,
    type: 'face_verified',
    message: verified ? 'Face verification passed.' : 'Face verification failed.',
    metadata: { hasProfilePhoto, confidence, faceDetected }
  });

  res.json({
    verified,
    message: verified
      ? hasProfilePhoto
        ? 'Face verified successfully.'
        : 'Live face verified. Add a profile photo later for stricter identity checks.'
      : 'Face not detected clearly. Keep one face centered in the camera and retry.'
  });
});

router.get('/student-insights', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('badges performanceInsights');
  const results = await Result.find({ studentId: req.user.id }).sort({ submittedAt: -1 }).limit(10);
  res.json({
    badges: user?.badges || [],
    performanceInsights: user?.performanceInsights || {},
    recentResults: results
  });
});

router.get('/reports/export/:type', verifyToken, isAdmin, async (req, res) => {
  const { type } = req.params;
  const format = ['csv', 'excel', 'pdf'].includes(req.query.format) ? req.query.format : 'csv';
  let rows = [];

  if (type === 'results' || type === 'student-performance') {
    const results = await Result.find({}).sort({ submittedAt: -1 });
    rows = results.map(result => ({
      Student: result.studentName,
      Exam: result.examTitle,
      Score: result.score,
      Total: result.total,
      Percentage: result.percentage,
      SubmittedAt: result.submittedAt
    }));
  } else if (type === 'violations') {
    const alerts = await Alert.find({}).sort({ createdAt: -1 });
    rows = alerts.map(alert => ({
      Student: alert.studentName,
      Exam: alert.examTitle,
      Type: alert.type,
      Severity: alert.severity,
      Browser: alert.deviceInfo?.browser,
      OS: alert.deviceInfo?.operatingSystem,
      CreatedAt: alert.createdAt
    }));
  } else if (type === 'attendance') {
    const logs = await ActivityLog.find({ type: { $in: ['exam_start', 'exam_end'] } }).sort({ createdAt: -1 });
    rows = logs.map(log => ({
      Student: log.studentName,
      Exam: log.examTitle,
      Event: log.type,
      Time: log.createdAt
    }));
  }

  const exportRows = rows.length ? rows : [{ Message: 'No data available' }];
  const title = `${type.replace(/-/g, ' ')} report`;

  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xls"`);
    return res.send(buildExcelHtml(exportRows, title));
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    return res.send(buildSimplePdf(exportRows, title));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(buildCsv(exportRows));
});

router.get('/device-info', verifyToken, isAdmin, async (req, res) => {
  const results = await Result.find({}).sort({ submittedAt: -1 }).limit(100);
  res.json(results.map(result => ({
    studentName: result.studentName,
    examTitle: result.examTitle,
    submittedAt: result.submittedAt,
    deviceInfo: {
      ...result.deviceInfo?.toObject?.(),
      ipAddress: result.deviceInfo?.ipAddress || getClientIp(req)
    }
  })));
});

module.exports = router;
