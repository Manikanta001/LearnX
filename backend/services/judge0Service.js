const axios = require('axios');
const { executeLocally } = require('./localExecutor');

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  'c++': 54,
};

const JUDGE0_REQUEST_TIMEOUT_MS = Number(process.env.JUDGE0_TIMEOUT_MS || 8000);
const JUDGE0_COOLDOWN_MS = Number(process.env.JUDGE0_COOLDOWN_MS || 120000);
const FORCE_LOCAL_EXECUTION = String(process.env.FORCE_LOCAL_EXECUTION || '').toLowerCase() === 'true';

let judge0DisabledUntil = 0;

const isJudge0TemporarilyDisabled = () => Date.now() < judge0DisabledUntil;

const shouldTripCircuit = (error) => {
  const status = error?.response?.status;
  return (
    ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error?.code) ||
    status === 429 ||
    (typeof status === 'number' && status >= 500)
  );
};

const runLocally = async (code, language, stdin, reason) => {
  console.warn(`Using local execution: ${reason}`);
  return executeLocally(code, language, stdin);
};

// Execute code using Judge0 API, with local fallback
const executeCode = async (code, language, stdin = '') => {
  const apiUrl = process.env.JUDGE0_API_URL;
  const apiKey = process.env.JUDGE0_API_KEY;

  if (FORCE_LOCAL_EXECUTION) {
    return runLocally(code, language, stdin, 'FORCE_LOCAL_EXECUTION=true');
  }

  // If Judge0 is not configured, use local execution
  if (!apiUrl || !apiKey) {
    return runLocally(code, language, stdin, 'Judge0 not configured');
  }

  if (isJudge0TemporarilyDisabled()) {
    return runLocally(code, language, stdin, 'Judge0 temporarily disabled after recent failures');
  }

  try {
    const languageId = LANGUAGE_MAP[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Create submission
    const { data: submission } = await axios.post(
      `${apiUrl}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        timeout: JUDGE0_REQUEST_TIMEOUT_MS,
      }
    );

    const statusMap = {
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      11: 'Runtime Error',
    };

    const result = {
      status: statusMap[submission.status?.id] || 'Error',
      output: submission.stdout || submission.stderr || submission.compile_output || '',
      time: submission.time || 0,
      memory: submission.memory || 0,
    };

    // Ensure we always return a valid response
    if (!result.output) {
      result.output = 'Program executed successfully, but produced no output.';
    }

    return result;
  } catch (error) {
    if (shouldTripCircuit(error)) {
      judge0DisabledUntil = Date.now() + JUDGE0_COOLDOWN_MS;
      console.warn(`Judge0 circuit opened for ${JUDGE0_COOLDOWN_MS}ms`);
    }
    console.error('Judge0 execution failed, falling back to local execution:', error.message);
    // Fallback to local execution
    return runLocally(code, language, stdin, error.message || 'Judge0 request failed');
  }
};

module.exports = { executeCode };
