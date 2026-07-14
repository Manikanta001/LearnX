const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleAuth');
const {
  createQuiz,
  getQuizById,
  submitQuizAnswers,
  getQuizAttempts,
  getAllQuizzes,
  getAllAttemptsForQuiz,
} = require('../controllers/quizController');

// List all quizzes
router.get('/', authenticate, getAllQuizzes);

// List all attempts for a quiz (Instructor/Admin)
router.get('/:id/all-attempts', authenticate, isInstructor, getAllAttemptsForQuiz);

// Open reading list or instructor modifications
router.post('/', authenticate, isInstructor, createQuiz);

// Quiz attempts & detail
router.get('/:id', authenticate, getQuizById);
router.post('/:id/submit', authenticate, submitQuizAnswers);
router.get('/:id/attempts', authenticate, getQuizAttempts);

module.exports = router;
