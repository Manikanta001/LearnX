const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const crypto = require('crypto');

// Get all courses with optional filters
const getCourses = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const courses = await Course.find(query).populate('instructor', 'name email');
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get single course details with enrollment status
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const course = await Course.findById(id).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if current user is enrolled
    let enrollment = null;
    if (userId) {
      enrollment = await Enrollment.findOne({ student: userId, course: id });
    }

    res.json({
      course,
      isEnrolled: !!enrollment,
      progress: enrollment ? enrollment.progress : 0,
      completedLessons: enrollment ? enrollment.completedLessons : [],
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
};

// Create a new course (Instructor/Admin)
const createCourse = async (req, res) => {
  try {
    const { title, description, category, difficulty, thumbnail, modules } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const course = new Course({
      title,
      description,
      category,
      difficulty: difficulty || 'Easy',
      thumbnail: thumbnail || '',
      instructor: req.user.id,
      modules: modules || [],
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course structure (Instructor/Admin)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, thumbnail, modules, finalAssessment } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You did not create this course' });
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (difficulty !== undefined) course.difficulty = difficulty;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (modules !== undefined) course.modules = modules;
    if (finalAssessment !== undefined) course.finalAssessment = finalAssessment || null;

    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Enroll a student in a course
const enrollInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: userId, course: courseId });
    if (existing) {
      return res.status(400).json({ error: 'You are already enrolled in this course' });
    }

    const enrollment = new Enrollment({
      student: userId,
      course: courseId,
      progress: 0,
      completedLessons: [],
    });
    await enrollment.save();

    res.status(201).json({ message: 'Successfully enrolled in course', enrollment });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
};

// Mark a lesson as complete & update course progress
const completeLesson = async (req, res) => {
  try {
    const { id: courseId, lessonId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment record not found. Please enroll first.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find lesson in modules
    let lessonExists = false;
    let totalLessonsCount = 0;
    course.modules.forEach((mod) => {
      totalLessonsCount += mod.lessons.length;
      const found = mod.lessons.id(lessonId);
      if (found) lessonExists = true;
    });

    if (!lessonExists) {
      return res.status(404).json({ error: 'Lesson not found in this course' });
    }

    // Add to completed if not already present
    const alreadyCompleted = enrollment.completedLessons.includes(lessonId);
    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lessonId);
      
      // Award 10 XP for lesson completion
      const user = await User.findById(userId);
      if (user) {
        user.xp += 10;
        await user.save();
      }
    }

    // Recalculate progress percentage
    if (totalLessonsCount > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessonsCount) * 100);
    } else {
      enrollment.progress = 100;
    }

    // Check if course completed
    if (enrollment.progress === 100 && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();

      // Award 200 XP for course completion
      const user = await User.findById(userId);
      if (user) {
        user.xp += 200;
        await user.save();

        // Automatically issue completion certificate
        const certId = crypto.randomBytes(8).toString('hex');
        const cert = new Certificate({
          student: userId,
          course: courseId,
          type: 'CourseCompletion',
          nameOnCertificate: user.name,
          courseName: course.title,
          uniqueId: certId,
          qrCodeData: `${process.env.APP_URL || 'http://localhost:3000'}/verify/${certId}`,
        });
        await cert.save();
      }
    }

    await enrollment.save();
    res.json({ message: 'Lesson progress updated', enrollment });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson completion status' });
  }
};

// Get list of courses enrolled by logged-in user
const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await Enrollment.find({ student: userId }).populate({
      path: 'course',
      select: 'title description thumbnail category difficulty instructor modules',
      populate: { path: 'instructor', select: 'name' }
    });
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  enrollInCourse,
  completeLesson,
  getEnrolledCourses,
};
