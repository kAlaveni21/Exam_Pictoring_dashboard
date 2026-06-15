const Result = require('../models/Result');
const User = require('../models/User');

const BADGES = {
  TOP_PERFORMER: {
    name: 'Top Performer',
    description: 'Average score is 85% or higher.'
  },
  PERFECT_SCORE: {
    name: 'Perfect Score',
    description: 'Scored 100% in an exam.'
  },
  FAST_FINISHER: {
    name: 'Fast Finisher',
    description: 'Completed an exam in less than half the allotted time.'
  },
  CONSISTENT_LEARNER: {
    name: 'Consistent Learner',
    description: 'Completed at least three exams with a passing score.'
  }
};

const addBadge = (badges, badge) => {
  if (badges.some(existing => existing.name === badge.name)) return badges;
  return [...badges, { ...badge, awardedAt: new Date() }];
};

const updateStudentAwardsAndInsights = async (studentId) => {
  const results = await Result.find({ studentId }).sort({ submittedAt: -1 });
  const user = await User.findById(studentId);
  if (!user) return null;

  const average = results.length
    ? results.reduce((sum, result) => sum + result.percentage, 0) / results.length
    : 0;

  let badges = user.badges || [];
  if (average >= 85) badges = addBadge(badges, BADGES.TOP_PERFORMER);
  if (results.some(result => result.percentage === 100)) badges = addBadge(badges, BADGES.PERFECT_SCORE);
  if (results.some(result => result.durationSeconds > 0 && result.durationSeconds <= (result.total || 1) * 30)) {
    badges = addBadge(badges, BADGES.FAST_FINISHER);
  }
  if (results.filter(result => result.percentage >= 50).length >= 3) badges = addBadge(badges, BADGES.CONSISTENT_LEARNER);

  const topicMap = {};
  results.forEach((result) => {
    result.answers.forEach((answer) => {
      const topic = answer.topic || 'General';
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
      topicMap[topic].total += 1;
      if (answer.isCorrect) topicMap[topic].correct += 1;
    });
  });

  const topics = Object.entries(topicMap).map(([topic, value]) => ({
    topic,
    accuracy: value.total ? Math.round((value.correct / value.total) * 100) : 0
  }));

  const strongTopics = topics.filter(item => item.accuracy >= 75).map(item => item.topic);
  const weakTopics = topics.filter(item => item.accuracy < 60).map(item => item.topic);
  const suggestedImprovements = weakTopics.length
    ? weakTopics.map(topic => `Revise ${topic} concepts and attempt focused practice questions.`)
    : ['Keep practicing mixed-topic mock exams to maintain consistency.'];

  user.badges = badges;
  user.performanceInsights = {
    strongTopics,
    weakTopics,
    suggestedImprovements,
    summary: results.length
      ? `Average score is ${Math.round(average)}% across ${results.length} completed exam${results.length === 1 ? '' : 's'}.`
      : 'Complete an exam to generate performance insights.'
  };

  await user.save();
  return user;
};

module.exports = { updateStudentAwardsAndInsights };
