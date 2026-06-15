const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const ExamTemplate = require('../models/ExamTemplate');

router.get('/', verifyToken, isAdmin, async (req, res) => {
  const templates = await ExamTemplate.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
  res.json(templates);
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const template = await ExamTemplate.create({
    name: req.body.name,
    description: req.body.description || '',
    duration: req.body.duration || 30,
    questions: req.body.questions || [],
    createdBy: req.user.id
  });
  res.status(201).json(template);
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  await ExamTemplate.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  res.json({ message: 'Template deleted.' });
});

module.exports = router;
