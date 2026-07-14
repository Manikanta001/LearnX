const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleAuth');
const {
  assistProblem,
  solveDoubt,
  generateRoadmap,
  generateQuiz,
  generateAssignment,
} = require('../controllers/aiController');

// All AI features require authentication
router.use(authenticate);

// Student & general AI helpers
router.post('/assist', assistProblem);
router.post('/doubt', solveDoubt);
router.post('/roadmap', generateRoadmap);

// Instructor-only generation features
router.post('/generate-quiz', isInstructor, generateQuiz);
router.post('/generate-assignment', isInstructor, generateAssignment);

module.exports = router;