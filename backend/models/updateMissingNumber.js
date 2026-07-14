// One-time script: updates Missing Number to use clean starterCode + executionWrapper
// Usage: node models/updateMissingNumber.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');

const DOC_ID = 'IT3GZ8bMidk256ADZdqw';

const starterCode = {
  javascript:
    'function missingNumber(nums) {\n  // Write your solution here\n}',
  python:
    'def missingNumber(nums):\n    # Write your solution here\n    pass',
  java:
    'class Solution {\n    public int missingNumber(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}',
  cpp:
    'class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};',
};

// __USER_CODE__ is replaced with the user's submitted code at runtime
const executionWrapper = {
  javascript:
    '__USER_CODE__\n\nconst _input = require(\'fs\').readFileSync(0, \'utf-8\').trim().split(\' \').map(Number);\nconsole.log(missingNumber(_input));',
  python:
    '__USER_CODE__\n\nimport sys as _sys\n_nums = list(map(int, _sys.stdin.read().strip().split()))\nprint(missingNumber(_nums))',
  // public class Main is detected by the executor to name the file Main.java
  java:
    'import java.util.*;\n__USER_CODE__\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] parts = sc.nextLine().trim().split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        System.out.println(new Solution().missingNumber(nums));\n    }\n}',
  cpp:
    '#include <bits/stdc++.h>\nusing namespace std;\n__USER_CODE__\nint main() {\n    vector<int> nums;\n    int x;\n    while (cin >> x) nums.push_back(x);\n    Solution sol;\n    cout << sol.missingNumber(nums) << endl;\n    return 0;\n}',
};

async function update() {
  console.log(`Updating document ${DOC_ID}...`);
  await db.collection('problems').doc(DOC_ID).update({ starterCode, executionWrapper });
  console.log('Done! starterCode and executionWrapper updated.');
  process.exit(0);
}

update().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
