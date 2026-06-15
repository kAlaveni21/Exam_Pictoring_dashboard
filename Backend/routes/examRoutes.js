const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { updateStudentAwardsAndInsights } = require('../utils/awards');
const { sendExamScheduleEmail } = require('../utils/email');

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';

const getAssignedStudentRecipients = async (studentIds = []) => {
  if (!studentIds.length) return [];
  return User.find({ _id: { $in: studentIds }, role: 'student' }).select('name email');
};

const idsChanged = (before = [], after = []) => {
  const left = before.map(String).sort().join(',');
  const right = after.map(String).sort().join(',');
  return left !== right;
};

const scheduleChanged = (before, next) => {
  const beforeStart = before?.startTime ? new Date(before.startTime).getTime() : null;
  const nextStart = next?.startTime ? new Date(next.startTime).getTime() : null;
  const beforeEnd = before?.endTime ? new Date(before.endTime).getTime() : null;
  const nextEnd = next?.endTime ? new Date(next.endTime).getTime() : null;

  return (
    before?.title !== next?.title ||
    before?.duration !== next?.duration ||
    beforeStart !== nextStart ||
    beforeEnd !== nextEnd ||
    idsChanged(before?.assignedStudents || [], next?.assignedStudents || [])
  );
};

const notifyAssignedStudents = async (exam, mode) => {
  if (!exam.startTime || !exam.assignedStudents?.length) {
    return { sent: 0, skipped: true, reason: 'Exam has no start time or assigned students.' };
  }

  try {
    const students = await getAssignedStudentRecipients(exam.assignedStudents);
    return sendExamScheduleEmail(exam, students, mode);
  } catch (error) {
    console.error('Exam email notification error:', error);
    return { sent: 0, skipped: true, reason: 'Email notification failed.' };
  }
};

// Get all exams
router.get('/', verifyToken, async (req, res) => {
  try {
    const exams = await Exam.find({ isActive: true }).select('-questions.correctAnswer');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams.' });
  }
});

// Get single exam (with questions for taking)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    // If student, hide correct answers
    if (req.user.role === 'student') {
      const examObj = exam.toObject();
      examObj.questions = examObj.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty
      }));
      return res.json(examObj);
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam.' });
  }
});

// Create exam (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, duration, questions, startTime, endTime, assignedStudents } = req.body;

    const exam = new Exam({
      title,
      description,
      duration,
      startTime: startTime || null,
      endTime: endTime || null,
      assignedStudents: assignedStudents || [],
      questions,
      createdBy: req.user.id
    });

    await exam.save();
    const emailNotifications = await notifyAssignedStudents(exam, 'scheduled');
    res.status(201).json({ message: 'Exam created successfully.', exam, emailNotifications });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Error creating exam.' });
  }
});

// Update exam (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, duration, questions, startTime, endTime, assignedStudents, isActive } = req.body;
    const existingExam = await Exam.findById(req.params.id);

    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          description,
          duration,
          questions,
          startTime: startTime || null,
          endTime: endTime || null,
          assignedStudents: assignedStudents || [],
          isActive: isActive !== undefined ? isActive : true
        }
      },
      { new: true, runValidators: true }
    );

    const emailNotifications = scheduleChanged(existingExam, exam)
      ? await notifyAssignedStudents(exam, 'updated')
      : { sent: 0, skipped: true, reason: 'Schedule did not change.' };

    res.json({ message: 'Exam updated successfully.', exam, emailNotifications });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Error updating exam.' });
  }
});

// Delete exam (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    res.json({ message: 'Exam deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam.' });
  }
});

// Bulk append questions (admin only)
router.post('/:id/bulk-questions', verifyToken, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const questions = (req.body.questions || []).filter(question =>
      question.question &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.correctAnswer !== undefined
    );

    if (!questions.length) {
      return res.status(400).json({ message: 'No valid questions found in uploaded file.' });
    }

    exam.questions.push(...questions.map(question => ({
      question: String(question.question).trim(),
      options: question.options.map(option => String(option).trim()),
      correctAnswer: Number(question.correctAnswer),
      topic: question.topic || 'General',
      difficulty: question.difficulty || 'medium'
    })));

    await exam.save();
    res.json({ message: `${questions.length} questions added successfully.`, exam });
  } catch (error) {
    console.error('Bulk question upload error:', error);
    res.status(500).json({ message: 'Error uploading questions.' });
  }
});

// Submit exam answers
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    const { answers, deviceInfo = {}, durationSeconds = 0, startedAt = null } = req.body; // { questionId: selectedOptionIndex }
    let score = 0;
    let total = exam.questions.length;
    const answerRows = [];

    exam.questions.forEach((q) => {
      const selectedAnswer = answers[q._id.toString()];
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) {
        score++;
      }

      answerRows.push({
        questionId: q._id,
        questionText: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'medium'
      });
    });

    const percentage = Math.round((score / total) * 100);
    await Result.create({
      studentId: req.user.id,
      studentName: req.user.name,
      examId: exam._id,
      examTitle: exam.title,
      score,
      total,
      percentage,
      durationSeconds,
      answers: answerRows,
      deviceInfo: {
        ...deviceInfo,
        ipAddress: deviceInfo.ipAddress || getClientIp(req),
        userAgent: req.headers['user-agent'] || deviceInfo.userAgent || ''
      },
      startedAt,
      submittedAt: new Date()
    });

    await ActivityLog.create({
      studentId: req.user.id,
      studentName: req.user.name,
      examId: exam._id,
      examTitle: exam.title,
      type: 'exam_end',
      message: `Submitted ${exam.title}.`,
      metadata: { score, total, percentage }
    });

    await updateStudentAwardsAndInsights(req.user.id);

    res.json({
      message: 'Exam submitted successfully.',
      score,
      total,
      percentage
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'Error submitting exam.' });
  }
});

module.exports = router;
