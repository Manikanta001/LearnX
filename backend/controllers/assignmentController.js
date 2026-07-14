const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { fetchLeetcodeProblem } = require('../services/leetcodeService');
const { executeCode } = require('../services/judge0Service');

// Create a new assignment (Instructor/Admin)
const createAssignment = async (req, res) => {
  try {
    const { title, description, course, type, maxMarks, deadline, instructions, codingProblem, mcqQuestions, fileRequirements, leetcodeNumber } = req.body;

    if (!type || !deadline) {
      return res.status(400).json({ error: 'Type and deadline are required' });
    }

    let finalTitle = title;
    let finalDescription = description;
    let finalCodingProblem = codingProblem || null;

    if (type === 'Coding' && leetcodeNumber) {
      try {
        const leetcodeData = await fetchLeetcodeProblem(leetcodeNumber);
        
        // Find existing or create new Problem
        const problemObj = await Problem.findOneAndUpdate(
          { title: leetcodeData.title },
          { $set: leetcodeData },
          { upsert: true, new: true }
        );
        
        finalCodingProblem = problemObj._id;
        if (!finalTitle) finalTitle = leetcodeData.title;
        if (!finalDescription) finalDescription = `LeetCode coding challenge: ${leetcodeData.title}`;
      } catch (err) {
        return res.status(400).json({ error: `Failed to fetch LeetCode problem: ${err.message}` });
      }
    }

    if (!finalTitle) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const assignment = new Assignment({
      title: finalTitle,
      description: finalDescription,
      course: course || null,
      type,
      maxMarks: maxMarks || 100,
      deadline,
      instructions: instructions || '',
      codingProblem: finalCodingProblem,
      mcqQuestions: mcqQuestions || [],
      fileRequirements: fileRequirements || 'PDF or ZIP, max 10MB',
      createdBy: req.user.id,
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

// Get assignment details
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate('codingProblem');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Hide MCQ answers if student is reading it
    const assignmentObj = assignment.toObject();
    if (req.user.role === 'student' && assignmentObj.mcqQuestions) {
      assignmentObj.mcqQuestions = assignmentObj.mcqQuestions.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.json(assignmentObj);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { mcqAnswers, codingSubmission, fileUrl } = req.body;
    const userId = req.user.id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if deadline passed
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ error: 'Submission deadline has passed' });
    }

    // Check if already submitted
    const existing = await AssignmentSubmission.findOne({ user: userId, assignment: id });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }

    let score = 0;
    let status = 'Submitted';
    let gradedAt = null;
    let feedback = '';

    // Auto grading for MCQ assignments
    if (assignment.type === 'MCQ') {
      let correctAnswersCount = 0;
      assignment.mcqQuestions.forEach((q) => {
        const studentAns = mcqAnswers.find((ans) => ans.questionId === q._id.toString());
        if (studentAns && studentAns.selectedAnswer === q.correctAnswer) {
          correctAnswersCount += 1;
        }
      });
      const ratio = correctAnswersCount / assignment.mcqQuestions.length;
      score = Math.round(ratio * assignment.maxMarks);
      status = 'Graded';
      gradedAt = new Date();
    } else if (assignment.type === 'Coding') {
      const { code, language } = codingSubmission || {};
      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required for Coding assignments' });
      }

      // Fetch the codingProblem details
      const problem = await Problem.findById(assignment.codingProblem);
      if (!problem) {
        return res.status(400).json({ error: 'Coding problem details not found for this assignment' });
      }

      const testCases = Array.isArray(problem.testCases) ? problem.testCases.slice(0, 3) : [];
      if (testCases.length === 0) {
        return res.status(400).json({ error: 'Problem does not have any test cases configured' });
      }

      let passedAll = true;
      let failMessage = '';

      for (let i = 0; i < testCases.length; i += 1) {
        const testCase = testCases[i];
        const wrapper = problem.executionWrapper && problem.executionWrapper[language];
        const execCode = wrapper ? wrapper.replace('__USER_CODE__', code) : code;
        const execution = await executeCode(execCode, language, testCase.input || '');

        const actualOutput = String(execution.output || '').replace(/\r\n/g, '\n').trim();
        const expectedOutput = String(testCase.expectedOutput || '').replace(/\r\n/g, '\n').trim();
        const passed = execution.status === 'Accepted' && actualOutput === expectedOutput;

        if (!passed) {
          passedAll = false;
          failMessage = `Failed on testcase ${i + 1}. Expected: ${testCase.expectedOutput} | Got: ${execution.output || '(empty)'}`;
          break;
        }
      }

      if (!passedAll) {
        return res.status(400).json({ error: `Test cases failed: ${failMessage}` });
      }

      score = assignment.maxMarks;
      status = 'Graded';
      gradedAt = new Date();
      feedback = 'All compiler test cases passed. Auto-graded.';
    }

    const submission = new AssignmentSubmission({
      user: userId,
      assignment: id,
      submissionType: assignment.type,
      mcqAnswers: mcqAnswers || [],
      codingSubmission: codingSubmission || null,
      fileUrl: fileUrl || '',
      score,
      status,
      gradedAt,
      feedback,
    });
    await submission.save();

    // Reward XP
    const user = await User.findById(userId);
    if (user) {
      // Complete Assignment = 30 XP (award now if MCQ/Coding auto-graded, or award later when instructor grades)
      if (assignment.type === 'MCQ' || assignment.type === 'Coding') {
        user.xp += 30;
      } else {
        user.xp += 10; // 10 XP immediately on submission, 20 XP on grading
      }
      await user.save();
    }

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

// Grade student submission (Instructor/Admin)
const gradeAssignmentSubmission = async (req, res) => {
  try {
    const { subId } = req.params;
    const { score, feedback } = req.body;

    if (score === undefined) {
      return res.status(400).json({ error: 'Score is required' });
    }

    const submission = await AssignmentSubmission.findById(subId).populate('assignment');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const wasGraded = submission.status === 'Graded';
    submission.score = score;
    submission.feedback = feedback || '';
    submission.status = 'Graded';
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();

    await submission.save();

    // Award +20 XP remaining for student when graded (if not previously fully graded)
    if (!wasGraded) {
      const student = await User.findById(submission.user);
      if (student) {
        student.xp += 20; // Complete Assignment = 30 XP total (+10 immediate, +20 here)
        await student.save();
      }
    }

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// Get submissions list for an assignment (Instructor/Admin)
const getSubmissionsForAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate('user', 'name email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Get student's own submission for a specific assignment
const getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await AssignmentSubmission.findOne({ user: userId, assignment: id })
      .populate('gradedBy', 'name');

    res.json(submission);
  } catch (error) {
    console.error('Get own submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({}).populate('course', 'title');
    res.json(assignments);
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments list' });
  }
};

module.exports = {
  createAssignment,
  getAssignmentById,
  submitAssignment,
  gradeAssignmentSubmission,
  getSubmissionsForAssignment,
  getMySubmission,
  getAllAssignments,
};
