const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleAuth');
const {
  createAssignment,
  getAssignmentById,
  submitAssignment,
  gradeAssignmentSubmission,
  getSubmissionsForAssignment,
  getMySubmission,
  getAllAssignments,
} = require('../controllers/assignmentController');

// List all assignments
router.get('/', authenticate, getAllAssignments);

// Creation (Instructor/Admin)
router.post('/', authenticate, isInstructor, createAssignment);

// Submissions lists and grading (Instructor/Admin)
router.get('/:id/submissions', authenticate, isInstructor, getSubmissionsForAssignment);
router.post('/submission/:subId/grade', authenticate, isInstructor, gradeAssignmentSubmission);

// Student reading, submitting, checking own progress
router.get('/:id', authenticate, getAssignmentById);
router.post('/:id/submit', authenticate, submitAssignment);
router.get('/:id/my-submission', authenticate, getMySubmission);

module.exports = router;
