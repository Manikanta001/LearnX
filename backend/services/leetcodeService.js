const axios = require('axios');

const cleanHtmlForParsing = (html) => {
  if (!html) return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  return text;
};

const parseExamples = (htmlContent) => {
  const text = cleanHtmlForParsing(htmlContent);
  const testCases = [];
  const regex = /Input:\s*([^\n]+)[\s\S]*?Output:\s*([^\n]+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let inputVal = match[1].trim();
    let outputVal = match[2].trim();
    
    // Clean inputVal, e.g. "nums = [2,7,11,15], target = 9" -> "[2,7,11,15]\n9"
    let inputs = inputVal.split(/,\s*\w+\s*=/);
    inputs = inputs.map(x => x.replace(/^\w+\s*=\s*/, '').trim());
    
    // Clean quotes from outputs and inputs if they wrap the entire string
    let cleanedOutput = outputVal.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    let cleanedInputs = inputs.map(x => x.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));

    testCases.push({
      input: cleanedInputs.join('\n'),
      expectedOutput: cleanedOutput
    });
  }
  
  // Fallback default testcase if parsing failed
  if (testCases.length === 0) {
    testCases.push({
      input: "1\n2",
      expectedOutput: "3"
    });
  }
  return testCases;
};

const fetchLeetcodeProblem = async (problemNumber) => {
  try {
    const url = `https://leetcode-api-pied.vercel.app/problem/${problemNumber}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.title) {
      throw new Error(`Problem #${problemNumber} not found on LeetCode.`);
    }

    const testCases = parseExamples(data.content || '');

    // Map difficulty
    let difficulty = 'Medium';
    if (data.difficulty === 'Easy' || data.difficulty === 'Medium' || data.difficulty === 'Hard') {
      difficulty = data.difficulty;
    }

    // Basic generic starter code templates
    const titleSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const functionName = titleSlug.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    const starterCode = {
      javascript: `// Write your solution here\nfunction ${functionName}() {\n    \n}`,
      python: `# Write your solution here\ndef ${functionName}():\n    pass`,
      java: `// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`,
      cpp: `// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
    };

    return {
      title: `${data.questionFrontendId || problemNumber}. ${data.title}`,
      description: data.content || '',
      difficulty,
      topic: 'LeetCode Assignment',
      source: 'leetcode',
      sourceUrl: `https://leetcode.com/problems/${titleSlug}`,
      testCases,
      starterCode,
      executionWrapper: {
        javascript: `__USER_CODE__`,
        python: `__USER_CODE__`,
        java: `__USER_CODE__`,
        cpp: `__USER_CODE__`,
      }
    };
  } catch (error) {
    console.error(`Error fetching LeetCode problem #${problemNumber}:`, error.message);
    throw error;
  }
};

module.exports = { fetchLeetcodeProblem };
