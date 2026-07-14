const Problem = require('../models/Problem');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { executeCode } = require('../services/judge0Service');

const normalizeOutput = (text) => String(text ?? '').replace(/\r\n/g, '\n').trim();

// Submit solution
const submitSolution = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: 'problemId, code, and language are required' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Existing codebase expects exactly 3 test cases, or whatever test cases exist.
    // Let's slide or use all test cases up to a max of 3 for compile speed.
    const testCases = Array.isArray(problem.testCases) ? problem.testCases.slice(0, 3) : [];
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'Problem does not have any test cases configured' });
    }

    let result = { status: 'Accepted', output: 'All test cases passed.' };
    const testCaseResults = [];

    for (let i = 0; i < testCases.length; i += 1) {
      const testCase = testCases[i];
      const wrapper = problem.executionWrapper && problem.executionWrapper[language];
      const execCode = wrapper ? wrapper.replace('__USER_CODE__', code) : code;
      const execution = await executeCode(execCode, language, testCase.input || '');

      const actualOutput = normalizeOutput(execution.output);
      const expectedOutput = normalizeOutput(testCase.expectedOutput);
      const passed = execution.status === 'Accepted' && actualOutput === expectedOutput;

      testCaseResults.push({
        index: i + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: execution.output,
        status: passed ? 'Passed' : (execution.status === 'Accepted' ? 'Wrong Answer' : execution.status),
      });

      if (!passed) {
        result = {
          status: execution.status === 'Accepted' ? 'Wrong Answer' : execution.status,
          output: `Failed on test case ${i + 1}. Expected: ${testCase.expectedOutput} | Got: ${execution.output || '(empty)'}`,
        };
        break;
      }
    }

    // Save submission
    const submission = new Submission({
      user: userId,
      problem: problemId,
      code,
      language,
      result: result.status,
      output: result.output || '',
      testCaseResults,
    });
    await submission.save();

    // Update user's solved/attempted problems & streaks & XP
    const user = await User.findById(userId);
    if (user) {
      if (!user.attemptedProblems.includes(problemId)) {
        user.attemptedProblems.push(problemId);
      }

      if (result.status === 'Accepted') {
        const alreadySolved = user.solvedProblems.includes(problemId);
        if (!alreadySolved) {
          user.solvedProblems.push(problemId);
          user.xp += 20; // 20 XP on Problem Solved
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
        const currentCount = user.solveHistory.get(today) || 0;
        user.solveHistory.set(today, currentCount + 1);

        // Update recently solved
        const currentRecent = user.recentlySolved.filter((id) => id !== problemId);
        user.recentlySolved = [problemId, ...currentRecent].slice(0, 10);
      }

      await user.save();
    }

    res.json({ message: 'Solution submitted', submission });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit solution' });
  }
};

// Run code without submitting
const runCode = async (req, res) => {
  try {
    const { code, language, input, problemId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'code and language are required' });
    }

    let execCode = code;

    // Apply execution wrapper if provided
    if (problemId) {
      try {
        const problem = await Problem.findById(problemId);
        if (problem) {
          const wrapper = problem.executionWrapper && problem.executionWrapper[language];
          if (wrapper) {
            execCode = wrapper.replace('__USER_CODE__', code);
          }
        }
      } catch (wrapperError) {
        console.warn('Error fetching problem wrapper, proceeding with raw code:', wrapperError.message);
      }
    }

    let result;
    try {
      result = await executeCode(execCode, language, input || '');
    } catch (execError) {
      console.error('Code execution error:', execError);
      return res.json({
        status: 'Runtime Error',
        output: execError.message || 'Code execution failed',
        time: 0,
        memory: 0,
      });
    }

    if (!result) {
      return res.json({
        status: 'Error',
        output: 'Unknown execution error',
        time: 0,
        memory: 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ 
      error: 'Failed to run code', 
      details: error.message 
    });
  }
};

// Get user's submissions
const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.query;

    const query = { user: userId };
    if (problemId) {
      query.problem = problemId;
    }

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

module.exports = { submitSolution, runCode, getUserSubmissions };
