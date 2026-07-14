const Problem = require('../models/Problem');
const User = require('../models/User');
const { fetchLeetcodeProblem } = require('../services/leetcodeService');

const requiredFields = ['title', 'difficulty', 'topic', 'description'];

// Get all problems with optional filters
const getAllProblems = async (req, res) => {
  try {
    const { difficulty, topic } = req.query;
    const query = {};

    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (topic) {
      query.topic = new RegExp(topic, 'i');
    }

    const problems = await Problem.find(query);
    res.json(problems);
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

// Get single problem by ID
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

// Create a new problem
const createProblem = async (req, res) => {
  try {
    const { leetcodeNumber } = req.body || {};
    let problemPayload = {};

    if (leetcodeNumber) {
      try {
        const leetcodeData = await fetchLeetcodeProblem(leetcodeNumber);
        problemPayload = {
          title: leetcodeData.title,
          difficulty: leetcodeData.difficulty,
          topic: leetcodeData.topic,
          source: leetcodeData.source,
          sourceUrl: leetcodeData.sourceUrl,
          description: leetcodeData.description,
          examples: leetcodeData.examples || [],
          constraints: leetcodeData.constraints || [],
          hints: leetcodeData.hints || [],
          testCases: leetcodeData.testCases || [],
          starterCode: leetcodeData.starterCode,
          executionWrapper: leetcodeData.executionWrapper,
          tags: [leetcodeData.topic, 'leetcode'],
        };
      } catch (err) {
        return res.status(400).json({ error: `Failed to fetch LeetCode problem details: ${err.message}` });
      }
    } else {
      const missing = requiredFields.filter((field) => !req.body?.[field]);
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }

      const testCases = Array.isArray(req.body.testCases) ? req.body.testCases : [];
      const invalidTestCase = testCases.find((tc) => !tc.input || !tc.expectedOutput);
      if (invalidTestCase) {
        return res.status(400).json({ error: 'Each test case must include input and expectedOutput' });
      }

      problemPayload = {
        title: req.body.title,
        difficulty: req.body.difficulty,
        topic: req.body.topic,
        source: req.body.source || 'custom',
        sourceUrl: req.body.sourceUrl || '',
        description: req.body.description,
        examples: Array.isArray(req.body.examples) ? req.body.examples : [],
        constraints: Array.isArray(req.body.constraints) ? req.body.constraints : [],
        hints: Array.isArray(req.body.hints) ? req.body.hints : [],
        testCases,
        starterCode: req.body.starterCode || {
          javascript: '// Write your solution here',
          python: '# Write your solution here',
          java: '// Write your solution here',
          cpp: '// Write your solution here',
        },
        executionWrapper: req.body.executionWrapper || {
          javascript: '',
          python: '',
          java: '',
          cpp: '',
        },
        solution: req.body.solution || '',
        editorial: req.body.editorial || '',
        tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.topic],
      };
    }

    const newProblem = new Problem({
      ...problemPayload,
      createdBy: req.user?.id || 'admin',
    });

    await newProblem.save();
    return res.status(201).json(newProblem);
  } catch (error) {
    console.error('Create problem error:', error);
    return res.status(500).json({ error: 'Failed to create problem' });
  }
};

// Update user's problem solving progress (attempted / solved)
const updateProblemProgress = async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const { status } = req.body || {};
    const userId = req.user.id;

    const allowed = ['attempted', 'solved', 'reset'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'status must be one of: attempted, solved, reset' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (status === 'attempted') {
      if (!user.attemptedProblems.includes(problemId)) {
        user.attemptedProblems.push(problemId);
      }
    }

    if (status === 'solved') {
      if (!user.attemptedProblems.includes(problemId)) {
        user.attemptedProblems.push(problemId);
      }

      const alreadySolved = user.solvedProblems.includes(problemId);
      if (!alreadySolved) {
        user.solvedProblems.push(problemId);
        // Solve Problem = 20 XP
        user.xp += 20;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.lastSolvedDate;
      let newStreak = user.streak || 0;

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastDate === yesterday ? newStreak + 1 : 1;
      }

      user.streak = newStreak;
      user.lastSolvedDate = today;

      if (newStreak > user.maxStreak) {
        user.maxStreak = newStreak;
      }

      // Increment solve count for today in history map
      const currentHistoryCount = user.solveHistory.get(today) || 0;
      user.solveHistory.set(today, currentHistoryCount + 1);

      // Track recently solved: newest first, max 10 entries
      const currentRecent = user.recentlySolved.filter((id) => id !== problemId);
      user.recentlySolved = [problemId, ...currentRecent].slice(0, 10);
    }

    if (status === 'reset') {
      user.attemptedProblems = user.attemptedProblems.filter((id) => id !== problemId);
      user.solvedProblems = user.solvedProblems.filter((id) => id !== problemId);
    }

    await user.save();
    return res.json({ message: 'Progress updated', profile: user });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ error: 'Failed to update progress' });
  }
};

module.exports = {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblemProgress,
};
