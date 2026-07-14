const OpenAI = require('openai');

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key') {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({ apiKey });
};

const callOpenAI = async (messages, max_tokens = 300, isJson = false) => {
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const options = {
    model,
    messages,
    max_tokens,
    temperature: 0.7,
  };

  if (isJson) {
    options.response_format = { type: 'json_object' };
  }

  const response = await openai.chat.completions.create(options);
  return response.choices[0].message.content.trim();
};

// Hints
const generateHint = async (problem) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are a helpful coding tutor. Give a brief, helpful hint for solving the coding problem without giving away the full solution. Keep it to 2-3 sentences.',
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopic: ${problem.topic}`,
      },
    ],
    150
  );
};

const generateStepByStepHints = async (problem) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are a coding tutor. Give exactly 4 progressive hints. Start vague, then become more specific. Do not reveal full code. Format as a numbered list.',
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopic: ${problem.topic}\nStored hints: ${(problem.hints || []).join(' | ')}`,
      },
    ],
    300
  );
};

// Explain code solutions
const explainSolution = async (problem, userCode) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are a senior DSA mentor. Explain the solution in clear terms: core idea, data structure/algorithm choice, time complexity, space complexity, and why it works. Keep it practical and concise.',
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopic: ${problem.topic}\nUser solution or approach:\n${userCode || 'No code provided. Explain the likely optimal approach.'}`,
      },
    ],
    500
  );
};

// Optimize code reviews
const optimizeCode = async (problem, userCode) => {
  if (!userCode || !userCode.trim()) {
    throw new Error('Code is required to optimize');
  }

  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are a senior coding interviewer. Review the submitted code and suggest concrete optimizations: algorithmic improvements, time/space complexity changes, simplifications, and edge-case fixes. Do not rewrite the full program unless necessary. Use short sections and bullets.',
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}\nDescription: ${problem.description}\nDifficulty: ${problem.difficulty}\nTopic: ${problem.topic}\nCode to optimize:\n${userCode}`,
      },
    ],
    500
  );
};

// New AI Feature: AI Doubt Solver
const generateDoubtResponse = async (doubt, contextText) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are an expert academic tutor for computer science. Answer the student doubt concisely, providing a step-by-step clear explanation. Use code snippets in markdown if necessary.',
      },
      {
        role: 'user',
        content: `Context / Topic Details: ${contextText || 'General Computer Science'}\nStudent Doubt: ${doubt}`,
      },
    ],
    400
  );
};

// New AI Feature: AI Roadmap Generator
const generateStudyRoadmap = async (topic) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: 'You are a technical career guide. Generate a structured step-by-step roadmap for mastering the user input topic. The response must be a JSON object containing keys: "title", "description", "steps" (an array of steps, each with "name", "description", and "subtopics" array).',
      },
      {
        role: 'user',
        content: `Generate a detailed learning roadmap for: ${topic}`,
      },
    ],
    800,
    true
  );
};

// New AI Feature: AI Quiz Generator
const generateQuizFromAI = async (topic, count = 5) => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: `You are an assessment designer. Generate a CS quiz on the user input topic. The response must be a JSON object containing a "questions" array. Each question must have: "questionText", "type" (one of: 'SingleCorrect', 'MultipleCorrect', 'TrueFalse', 'FillInBlank'), "options" (array of strings, empty for FillInBlank), "correctAnswers" (array of strings, e.g., correct options or fill-in terms), and "explanation" string. Generate exactly ${count} questions.`,
      },
      {
        role: 'user',
        content: `Generate a quiz on the topic: ${topic}`,
      },
    ],
    1000,
    true
  );
};

// New AI Feature: AI Assignment Generator
const generateAssignmentFromAI = async (topic, type = 'FileUpload') => {
  return callOpenAI(
    [
      {
        role: 'system',
        content: `You are a curriculum creator. Generate an assignment brief on the user input topic. The response must be a JSON object with: "title", "description", "maxMarks" (number), "instructions" (markdown string), and "fileRequirements" or "mcqQuestions" depending on type. The type requested is ${type}.`,
      },
      {
        role: 'user',
        content: `Generate an assignment outline for the topic: ${topic}`,
      },
    ],
    800,
    true
  );
};

module.exports = {
  generateHint,
  generateStepByStepHints,
  explainSolution,
  optimizeCode,
  generateDoubtResponse,
  generateStudyRoadmap,
  generateQuizFromAI,
  generateAssignmentFromAI,
};
