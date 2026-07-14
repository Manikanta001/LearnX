const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleAuth');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  enrollInCourse,
  completeLesson,
  getEnrolledCourses,
} = require('../controllers/courseController');

// Open reading catalog
router.get('/', getCourses);

// Enrolled lists (must be defined before /:id parameter route to prevent clash)
router.get('/enrolled', authenticate, getEnrolledCourses);

// Details
router.get('/:id', authenticate, getCourseById);

// Creation and modification (Instructor/Admin)
router.post('/', authenticate, isInstructor, createCourse);
router.put('/:id', authenticate, isInstructor, updateCourse);

// Enrollment triggers
router.post('/:id/enroll', authenticate, enrollInCourse);
router.post('/:id/lessons/:lessonId/complete', authenticate, completeLesson);

module.exports = router;
