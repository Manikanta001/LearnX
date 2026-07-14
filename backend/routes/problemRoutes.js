const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleAuth');
const {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblemProgress,
} = require('../controllers/problemController');

// Open routes
router.get('/', getAllProblems);
router.get('/:id', getProblemById);

// Authenticated routes
router.post('/:id/progress', authenticate, updateProblemProgress);

// Instructor / Admin only routes
router.post('/', authenticate, isInstructor, createProblem);

module.exports = router;
