const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// Create a new quiz (Instructor/Admin)
const createQuiz = async (req, res) => {
  try {
    const { title, description, course, duration, maxAttempts, questions, negativeMarking, negativeMarkValue, pointsPerQuestion } = req.body;

    if (!title || !questions || !questions.length) {
      return res.status(400).json({ error: 'Title and questions list are required' });
    }

    const quiz = new Quiz({
      title,
      description,
      course: course || null,
      duration: duration || 15,
      maxAttempts: maxAttempts || 3,
      questions,
      negativeMarking: !!negativeMarking,
      negativeMarkValue: negativeMarkValue !== undefined ? negativeMarkValue : 0.25,
      pointsPerQuestion: pointsPerQuestion || 10,
      createdBy: req.user.id,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

// Get quiz questions (securely hides answers for active attempts)
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if student has reached max attempts
    const attemptsCount = await QuizSubmission.countDocuments({ user: userId, quiz: id });
    if (attemptsCount >= quiz.maxAttempts && req.user.role === 'student') {
      return res.status(403).json({ error: `You have reached the maximum attempt limit of ${quiz.maxAttempts} for this quiz.` });
    }

    // Security: Hiding correct answers & explanations from student
    const quizObject = quiz.toObject();
    if (req.user.role === 'student') {
      quizObject.questions = quizObject.questions.map((q) => {
        const { correctAnswers, explanation, ...publicFields } = q;
        return publicFields;
      });
    }

    res.json({ quiz: quizObject, currentAttempt: attemptsCount + 1 });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz details' });
  }
};

// Submit quiz and evaluate score
const submitQuizAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { answersSubmitted, timeTaken } = req.body; // Array of { questionId, selectedAnswers }
    const userId = req.user.id;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Count attempts
    const attemptNumber = (await QuizSubmission.countDocuments({ user: userId, quiz: id })) + 1;
    if (attemptNumber > quiz.maxAttempts && req.user.role === 'student') {
      return res.status(403).json({ error: 'Maximum attempts reached' });
    }

    let totalScore = 0;
    const points = quiz.pointsPerQuestion || 10;
    const maxScore = quiz.questions.length * points;

    // Grade each submitted question
    const evaluationDetails = quiz.questions.map((question) => {
      const submission = answersSubmitted.find((ans) => ans.questionId === question._id.toString());
      const selected = submission ? submission.selectedAnswers || [] : [];
      const correct = question.correctAnswers || [];

      let isCorrect = false;

      if (selected.length > 0) {
        if (question.type === 'SingleCorrect' || question.type === 'TrueFalse') {
          isCorrect = selected[0] === correct[0];
        } else if (question.type === 'MultipleCorrect') {
          // Both arrays must contain the exact same items
          const matchedCount = selected.filter((val) => correct.includes(val)).length;
          isCorrect = matchedCount === correct.length && selected.length === correct.length;
        } else if (question.type === 'FillInBlank') {
          isCorrect = selected.some((val) => 
            correct.some((ans) => ans.trim().toLowerCase() === val.trim().toLowerCase())
          );
        }
      }

      if (isCorrect) {
        totalScore += points;
      } else if (selected.length > 0 && quiz.negativeMarking) {
        totalScore -= quiz.negativeMarkValue * points;
      }

      return {
        questionId: question._id,
        questionText: question.questionText,
        selected,
        correct,
        isCorrect,
        explanation: question.explanation,
      };
    });

    // Score cannot go below 0
    totalScore = Math.max(0, totalScore);
    const passThreshold = maxScore * 0.5; // 50% passing mark
    const passed = totalScore >= passThreshold;

    const quizSubmission = new QuizSubmission({
      user: userId,
      quiz: id,
      answersSubmitted,
      score: totalScore,
      maxScore,
      passed,
      attemptNumber,
      timeTaken: timeTaken || 0,
    });
    await quizSubmission.save();

    // Award +10 XP on quiz submission
    const user = await User.findById(userId);
    if (user) {
      user.xp += 10;
      await user.save();
    }

    // Update Enrollment quiz score if Course ID is present
    if (quiz.course) {
      const enrollment = await Enrollment.findOne({ student: userId, course: quiz.course });
      if (enrollment) {
        const currentBest = enrollment.quizScores.get(id) || 0;
        if (totalScore > currentBest) {
          enrollment.quizScores.set(id, totalScore);
          await enrollment.save();
        }
      }
    }

    res.json({
      message: 'Quiz submitted and evaluated successfully',
      submission: {
        id: quizSubmission._id,
        score: totalScore,
        maxScore,
        passed,
        attemptNumber,
        timeTaken,
        evaluationDetails,
      }
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to process quiz submission' });
  }
};

// Get past quiz attempts
const getQuizAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submissions = await QuizSubmission.find({ user: userId, quiz: id })
      .sort({ attemptNumber: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
};

// Get all quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({}).populate('course', 'title');
    res.json(quizzes);
  } catch (error) {
    console.error('Get all quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes list' });
  }
};

// Get all attempts for a quiz (Instructor/Admin)
const getAllAttemptsForQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await QuizSubmission.find({ quiz: id })
      .populate('user', 'name email')
      .sort({ completedAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Get all attempts for quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch all attempts' });
  }
};

module.exports = {
  createQuiz,
  getQuizById,
  submitQuizAnswers,
  getQuizAttempts,
  getAllQuizzes,
  getAllAttemptsForQuiz,
};
