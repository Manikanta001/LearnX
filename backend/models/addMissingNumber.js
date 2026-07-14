// One-time script: adds the Missing Number problem to Firestore
// Usage: node models/addMissingNumber.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');

const problem = {
  title: 'Missing Number',
  difficulty: 'Easy',
  topic: 'Arrays',
  description:
    'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.',
  examples: [
    {
      input: 'nums = [3,0,1]',
      output: '2',
      explanation:
        'n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number in the range since it does not appear in nums.',
    },
    {
      input: 'nums = [0,1]',
      output: '2',
      explanation:
        'n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number in the range since it does not appear in nums.',
    },
    {
      input: 'nums = [9,6,4,2,3,5,7,0,1]',
      output: '8',
      explanation:
        'n = 9 since there are 9 numbers, so all numbers are in the range [0,9]. 8 is the missing number in the range since it does not appear in nums.',
    },
  ],
  constraints: [
    'n == nums.length',
    '1 <= n <= 10^4',
    '0 <= nums[i] <= n',
    'All the numbers of nums are unique.',
  ],
  hints: [
    'Use the Gauss formula: sum of [0..n] = n*(n+1)/2.',
    'The missing number = expected sum - actual sum.',
    'Alternatively, XOR all indices and all values; duplicates cancel out leaving the missing number.',
  ],
  solution:
    'function missingNumber(nums) {\n  const n = nums.length;\n  return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);\n}',
  testCases: [
    { input: '3 0 1', expectedOutput: '2' },
    { input: '0 1', expectedOutput: '2' },
    { input: '9 6 4 2 3 5 7 0 1', expectedOutput: '8' },
    { input: '0', expectedOutput: '1' },
  ],
  starterCode: {
    javascript:
      "function missingNumber(nums) {\n  // Write your solution here\n}\n\nconst nums = require('fs').readFileSync(0, 'utf-8').trim().split(' ').map(Number);\nconsole.log(missingNumber(nums));",
    python:
      'import sys\n\ndef missingNumber(nums):\n    # Write your solution here\n    pass\n\nnums = list(map(int, sys.stdin.read().strip().split()))\nprint(missingNumber(nums))',
    java:
      'import java.util.*;\nclass Solution {\n    public int missingNumber(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] parts = sc.nextLine().trim().split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        System.out.println(new Solution().missingNumber(nums));\n    }\n}',
    cpp:
      '#include <bits/stdc++.h>\nusing namespace std;\nclass Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};\nint main() {\n    vector<int> nums;\n    int x;\n    while (cin >> x) nums.push_back(x);\n    Solution sol;\n    cout << sol.missingNumber(nums) << endl;\n    return 0;\n}',
  },
};

async function addProblem() {
  console.log('Adding Missing Number to Firestore...');
  const ref = await db.collection('problems').add(problem);
  console.log(`Done! Added "${problem.title}" with ID: ${ref.id}`);
  process.exit(0);
}

addProblem().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
