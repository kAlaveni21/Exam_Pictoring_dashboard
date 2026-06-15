require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const alertRoutes = require('./routes/alertRoutes');
const advancedRoutes = require('./routes/advancedRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // larger limit for screenshots
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', advancedRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
const activeStudents = new Map();
const submittedStudents = new Set();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Student joins exam
  socket.on('student-join-exam', (data) => {
    const { studentId, studentName, examId, examTitle } = data;
    activeStudents.set(socket.id, {
      studentId,
      studentName,
      examId,
      examTitle,
      joinedAt: new Date()
    });

    // Notify admin dashboard
    io.emit('student-joined', {
      studentId,
      studentName,
      examId,
      examTitle,
      activeCount: activeStudents.size
    });

    console.log(`📝 Student ${studentName} joined exam: ${examTitle}`);
  });

  // Student submits exam
  socket.on('student-submit-exam', (data) => {
    const { studentId, studentName, examId, examTitle } = data;
    submittedStudents.add(studentId);

    // Notify admin dashboard
    io.emit('student-submitted', {
      studentId,
      studentName,
      examId,
      examTitle
    });

    console.log(`✅ Student ${studentName} submitted exam: ${examTitle}`);
  });

  // Real-time alert from student
  socket.on('proctor-alert', (alertData) => {
    console.log(`🚨 Alert from ${alertData.studentName}: ${alertData.type}`);

    // Broadcast to admin dashboard
    io.emit('new-alert', {
      ...alertData,
      timestamp: new Date().toISOString()
    });
  });

  // Student leaves exam
  socket.on('student-leave-exam', () => {
    const student = activeStudents.get(socket.id);
    if (student) {
      activeStudents.delete(socket.id);
      io.emit('student-left', {
        ...student,
        activeCount: activeStudents.size
      });
      console.log(`👋 Student ${student.studentName} left exam`);
    }
  });

  socket.on('disconnect', () => {
    const student = activeStudents.get(socket.id);
    if (student) {
      activeStudents.delete(socket.id);
      io.emit('student-left', {
        ...student,
        activeCount: activeStudents.size
      });
    }
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Get active students endpoint
app.get('/api/active-students', (req, res) => {
  const students = Array.from(activeStudents.values());
  res.json({
    count: students.length,
    students,
    submitted: Array.from(submittedStudents)
  });
});

// MongoDB connection
const PORT = process.env.PORT || 4000;
const DB_URL = process.env.DB_URL;

mongoose.connect(DB_URL)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO ready for connections`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Start server anyway for development without DB
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without DB)`);
    });
  });
