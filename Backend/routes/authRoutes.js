const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { verifyToken, isAdmin } = require('../middleware/auth');

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId || '',
  department: user.department || '',
  designation: user.designation || '',
  course: user.course || '',
  phone: user.phone || '',
  profilePhoto: user.profilePhoto || '',
  badges: user.badges || [],
  performanceInsights: user.performanceInsights || {}
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    if (user.role === 'student') {
      await ActivityLog.create({
        studentId: user._id,
        studentName: user.name,
        type: 'login',
        message: 'Student logged in.'
      });
    }

    res.json({
      message: 'Login successful.',
      token,
      user: {
        ...buildUserResponse(user)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Get current user's profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile.' });
  }
});

// Update current user's profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const allowedFields = ['name', 'studentId', 'department', 'designation', 'course', 'phone', 'profilePhoto'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]).trim();
      }
    });

    if (!updates.name) {
      delete updates.name;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

// Get all students (admin only)
router.get('/students', verifyToken, isAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students.' });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  if (req.user.role === 'student') {
    await ActivityLog.create({
      studentId: req.user.id,
      studentName: req.user.name,
      type: 'logout',
      message: 'Student logged out.'
    });
  }
  res.json({ message: 'Logged out.' });
});

module.exports = router;
