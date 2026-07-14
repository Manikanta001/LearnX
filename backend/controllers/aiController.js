const Problem = require('../models/Problem');
const {
  generateStepByStepHints,
  explainSolution,
  optimizeCode,
  generateDoubtResponse,
  generateStudyRoadmap,
  generateQuizFromAI,
  generateAssignmentFromAI,
} = require('../services/openaiService');

const fallbackAssist = (action, problem, userCode) => {
  const storedHints = problem.hints || [];

  if (action === 'hint-steps') {
    if (storedHints.length > 0) {
      return storedHints.map((hint, index) => `${index + 1}. ${hint}`).join('\n');
    }
    return '1. Start by identifying the core data structure or traversal pattern.\n2. Work through a small example manually.\n3. Look for repeated subproblems or graph relationships.\n4. Optimize only after the correct approach is clear.';
  }

  if (action === 'explain') {
    return `Problem: ${problem.title}\n\nA likely good approach is based on the topic "${problem.topic}". Focus on deriving the main idea first, then identify the right data structure, then reason about time and space complexity. ${userCode ? 'Your pasted solution can be explained in more detail once the OpenAI key is configured.' : 'Paste your solution or approach to get a more specific explanation when OpenAI is enabled.'}`;
  }

  if (action === 'optimize') {
    return 'Optimization suggestions require pasted code and work best when OpenAI is configured. In general, review time complexity, repeated scans, unnecessary extra memory, and whether a better data structure can reduce complexity.';
  }

  return 'Unsupported AI action.';
};

// Existing assist problem endpoint
const assistProblem = async (req, res) => {
  try {
    const { problemId, action, userCode } = req.body || {};

    if (!problemId || !action) {
      return res.status(400).json({ error: 'problemId and action are required' });
    }

    const allowed = ['hint-steps', 'explain', 'optimize'];
    if (!allowed.includes(action)) {
      return res.status(400).json({ error: 'action must be one of: hint-steps, explain, optimize' });
    }

    if (action === 'optimize' && !userCode?.trim()) {
      return res.status(400).json({ error: 'Paste your code first to optimize it' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    try {
      let content = '';
      if (action === 'hint-steps') {
        content = await generateStepByStepHints(problem);
      } else if (action === 'explain') {
        content = await explainSolution(problem, userCode || '');
      } else if (action === 'optimize') {
        content = await optimizeCode(problem, userCode || '');
      }

      return res.json({ content, source: 'ai' });
    } catch (err) {
      console.warn('AI fallback triggered for assist:', err.message);
      return res.json({ content: fallbackAssist(action, problem, userCode || ''), source: 'fallback' });
    }
  } catch (error) {
    console.error('AI assistant error:', error);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

// AI Doubt Solver
const solveDoubt = async (req, res) => {
  try {
    const { doubt, context } = req.body;

    if (!doubt) {
      return res.status(400).json({ error: 'Doubt query is required' });
    }

    try {
      const answer = await generateDoubtResponse(doubt, context || '');
      return res.json({ answer, source: 'ai' });
    } catch (err) {
      console.warn('AI fallback triggered for doubt solver:', err.message);
      const mockAnswers = [
        'To solve this problem, you should think about utilizing a Hash Map (Object/dictionary) which would reduce the lookup time to O(1) instead of O(N) when checking for complements.',
        'This issue usually happens because index boundaries are exceeded. Make sure your loops run up to array length - 1 and verify edge cases where arrays can be empty.',
        'The time complexity of this recursive solution is O(2^N) due to duplicate subproblems. You can optimize this to O(N) by storing intermediate results in a memoization table (Dynamic Programming).',
      ];
      const selectedAnswer = mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
      return res.json({
        answer: `[DEMO ANSWER] ${selectedAnswer}\n\n*Configure a valid OPENAI_API_KEY in backend/.env to get direct tailored tutoring feedback.*`,
        source: 'fallback',
      });
    }
  } catch (error) {
    console.error('AI doubt solver error:', error);
    res.status(500).json({ error: 'Internal AI tutor error' });
  }
};

// AI Roadmap Generator
const generateRoadmap = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    try {
      const roadmapText = await generateStudyRoadmap(topic);
      const roadmap = JSON.parse(roadmapText);
      return res.json({ roadmap, source: 'ai' });
    } catch (err) {
      console.warn('AI fallback triggered for roadmap:', err.message);
      // High quality fallback roadmap
      const fallbackRoadmap = {
        title: `${topic} Master Roadmap`,
        description: `Step-by-step master plan to learn and master ${topic} efficiently.`,
        steps: [
          {
            name: 'Phase 1: Foundations & Core Concepts',
            description: 'Learn the absolute basics, terminologies, and structure.',
            subtopics: ['Time & Space Complexity', 'Basic operations', 'Setup rules'],
          },
          {
            name: 'Phase 2: Common Operations & Patterns',
            description: 'Learn standard interview templates and traversal patterns.',
            subtopics: ['Iterative traversals', 'Two-pointer patterns', 'Edge configurations'],
          },
          {
            name: 'Phase 3: Advanced Optimization',
            description: 'Learn to optimize memory footprint and execution latency.',
            subtopics: ['Dynamic programming overlays', 'Memoization maps', 'Bit manipulation tricks'],
          },
        ],
      };
      return res.json({ roadmap: fallbackRoadmap, source: 'fallback' });
    }
  } catch (error) {
    console.error('AI roadmap error:', error);
    res.status(500).json({ error: 'Internal AI roadmap error' });
  }
};

// AI Quiz Generator
const generateQuiz = async (req, res) => {
  try {
    const { topic, count } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    try {
      const quizText = await generateQuizFromAI(topic, count || 5);
      const quiz = JSON.parse(quizText);
      return res.json({ quiz, source: 'ai' });
    } catch (err) {
      console.warn('AI fallback triggered for quiz generator:', err.message);
      // Return high quality dummy quiz questions
      const fallbackQuiz = {
        questions: [
          {
            questionText: `What is the worst-case time complexity of lookup in a standard Hash Table for ${topic}?`,
            type: 'SingleCorrect',
            options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
            correctAnswers: ['O(N)'],
            explanation: 'In the worst case where all elements hash to the same bucket (collision), lookup is O(N).',
          },
          {
            questionText: `Which of the following properties are true for operations under ${topic}?`,
            type: 'MultipleCorrect',
            options: ['Memory can be statically allocated', 'Collisions degrade performance', 'Thread-safety is guaranteed', 'Allows fast retrieval'],
            correctAnswers: ['Collisions degrade performance', 'Allows fast retrieval'],
            explanation: 'Collisions in search algorithms reduce efficiency, but general structures provide average case O(1) performance.',
          },
          {
            questionText: `True or False: A stack follows a First-In-First-Out (FIFO) access policy.`,
            type: 'TrueFalse',
            options: ['True', 'False'],
            correctAnswers: ['False'],
            explanation: 'Stacks follow Last-In-First-Out (LIFO). Queues follow First-In-First-Out (FIFO).',
          },
          {
            questionText: `Complete the sentence: In computer science, a ________ is used to securely store and hash user passwords.`,
            type: 'FillInBlank',
            options: [],
            correctAnswers: ['bcrypt', 'bcryptjs', 'hash function', 'kdf'],
            explanation: 'Bcrypt is a blowfish-based hashing function designed securely for passwords.',
          },
        ]
      };
      return res.json({ quiz: fallbackQuiz, source: 'fallback' });
    }
  } catch (error) {
    console.error('AI quiz generator error:', error);
    res.status(500).json({ error: 'Internal AI quiz generator error' });
  }
};

// AI Assignment Generator
const generateAssignment = async (req, res) => {
  try {
    const { topic, type } = req.body; // type: 'FileUpload' or 'MCQ'

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    try {
      const assignmentText = await generateAssignmentFromAI(topic, type || 'FileUpload');
      const assignment = JSON.parse(assignmentText);
      return res.json({ assignment, source: 'ai' });
    } catch (err) {
      console.warn('AI fallback triggered for assignment generator:', err.message);
      const fallbackAssignment = {
        title: `Comprehensive Assignment: ${topic}`,
        description: `Practical study review testing your knowledge on ${topic}.`,
        maxMarks: 100,
        instructions: `### Assignment Guidelines:\n1. Read all instructions carefully.\n2. Complete the research questions regarding **${topic}**.\n3. Make sure to detail your time and space complexity explanations for each question.\n4. Save your submission file as a PDF and upload below.`,
        fileRequirements: 'PDF Format, max 10MB',
      };
      return res.json({ assignment: fallbackAssignment, source: 'fallback' });
    }
  } catch (error) {
    console.error('AI assignment generator error:', error);
    res.status(500).json({ error: 'Internal AI assignment generator error' });
  }
};

module.exports = {
  assistProblem,
  solveDoubt,
  generateRoadmap,
  generateQuiz,
  generateAssignment,
};