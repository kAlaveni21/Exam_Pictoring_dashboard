// Seed script to create sample admin user and exam
// Run with: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Exam = require('./models/Exam');

const seed = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@exam.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@exam.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@exam.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create student user
    const studentExists = await User.findOne({ email: 'student@exam.com' });
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      await User.create({
        name: 'Test Student',
        email: 'student@exam.com',
        password: hashedPassword,
        role: 'student'
      });
      console.log('✅ Student user created: student@exam.com / student123');
    } else {
      console.log('Student user already exists');
    }

    // Create sample exam
    const examExists = await Exam.findOne({ title: 'JavaScript Fundamentals' });
    if (!examExists) {
      const admin = await User.findOne({ email: 'admin@exam.com' });
      await Exam.create({
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of JavaScript basics including variables, functions, and data types.',
        duration: 15,
        createdBy: admin._id,
        questions: [
          {
            question: 'What is the output of typeof null?',
            options: ['"null"', '"undefined"', '"object"', '"number"'],
            correctAnswer: 2
          },
          {
            question: 'Which keyword is used to declare a constant in JavaScript?',
            options: ['var', 'let', 'const', 'define'],
            correctAnswer: 2
          },
          {
            question: 'What does "===" operator check?',
            options: ['Value only', 'Type only', 'Value and type', 'Reference'],
            correctAnswer: 2
          },
          {
            question: 'Which method converts a JSON string to a JavaScript object?',
            options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.object()'],
            correctAnswer: 1
          },
          {
            question: 'What is the default value of an uninitialized variable?',
            options: ['null', '0', 'undefined', 'NaN'],
            correctAnswer: 2
          },
          {
            question: 'Which array method adds an element to the end?',
            options: ['push()', 'pop()', 'shift()', 'unshift()'],
            correctAnswer: 0
          },
          {
            question: 'What is a closure in JavaScript?',
            options: [
              'A way to close the browser',
              'A function with access to its outer scope variables',
              'A method to end a loop',
              'A type of error handling'
            ],
            correctAnswer: 1
          },
          {
            question: 'Which of the following is NOT a JavaScript data type?',
            options: ['Boolean', 'Float', 'Symbol', 'BigInt'],
            correctAnswer: 1
          },
          {
            question: 'What does the "this" keyword refer to in a regular function?',
            options: ['The function itself', 'The global object', 'The calling object', 'undefined'],
            correctAnswer: 2
          },
          {
            question: 'Which method is used to select an HTML element by ID?',
            options: ['querySelector()', 'getElementById()', 'getElementByClass()', 'selectById()'],
            correctAnswer: 1
          }
        ]
      });
      console.log('✅ Sample exam created: JavaScript Fundamentals');
    } else {
      console.log('Sample exam already exists');
    }

    console.log('\n🎉 Seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
