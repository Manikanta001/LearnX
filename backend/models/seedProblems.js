// Seed script: Run once to populate Firestore with sample problems
// Usage: node models/seedProblems.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');

const problems = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    hints: ['Try using a hash map to store values you have seen.', 'For each element, check if target - element exists in the map.'],
    solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n}',
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
      { input: '[3,3]\n6', expectedOutput: '[0,1]' },
    ],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}',
      python: 'def twoSum(nums, target):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stacks',
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      { input: 's = "()"', output: 'true', explanation: '' },
      { input: 's = "()[]{}"', output: 'true', explanation: '' },
      { input: 's = "(]"', output: 'false', explanation: '' },
    ],
    constraints: ['1 <= s.length <= 10^4', "s consists of parentheses only '()[]{}'"],
    hints: ['Use a stack.', 'Push opening brackets and pop for closing ones.'],
    solution: 'function isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "}": "{", "]": "[" };\n  for (const c of s) {\n    if ("({[".includes(c)) stack.push(c);\n    else if (stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}',
    testCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[{{}}]', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
    ],
    starterCode: {
      javascript: 'function isValid(s) {\n  // Write your solution here\n}',
      python: 'def isValid(s):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    topic: 'Linked Lists',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: '' },
      { input: 'head = [1,2]', output: '[2,1]', explanation: '' },
    ],
    constraints: ['The number of nodes in the list is in the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    hints: ['Use three pointers: prev, current, next.', 'Iterate through and reverse the pointers.'],
    solution: 'function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}',
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
      { input: '[1]', expectedOutput: '[1]' },
    ],
    starterCode: {
      javascript: 'function reverseList(head) {\n  // Write your solution here\n}',
      python: 'def reverseList(head):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No transactions are done and the max profit = 0.' },
    ],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' },
      { input: '[2,4,1,7,5,11]', expectedOutput: '10' },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: ['Track the minimum price seen so far.', 'At each step, compute profit = current price - min price.'],
    solution: 'function maxProfit(prices) {\n  let min = Infinity, profit = 0;\n  for (const p of prices) {\n    min = Math.min(min, p);\n    profit = Math.max(profit, p - min);\n  }\n  return profit;\n}',
    starterCode: {
      javascript: 'function maxProfit(prices) {\n  // Write your solution here\n}',
      python: 'def maxProfit(prices):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    topic: 'Arrays',
    description:
      'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1', explanation: '' },
    ],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[-1,-2,-3]', expectedOutput: '-1' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: ["Use Kadane's algorithm.", 'Track current sum and max sum.'],
    solution: "function maxSubArray(nums) {\n  let max = nums[0], cur = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    cur = Math.max(nums[i], cur + nums[i]);\n    max = Math.max(max, cur);\n  }\n  return max;\n}",
    starterCode: {
      javascript: 'function maxSubArray(nums) {\n  // Write your solution here\n}',
      python: 'def maxSubArray(nums):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    testCases: [
      { input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { input: '[]\n[]', expectedOutput: '[]' },
      { input: '[]\n[0]', expectedOutput: '[0]' },
    ],
    topic: 'Linked Lists',
    description:
      'You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: '' },
      { input: 'list1 = [], list2 = []', output: '[]', explanation: '' },
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    hints: ['Use a dummy head node.', 'Compare both heads and append the smaller one.'],
    solution: 'function mergeTwoLists(l1, l2) {\n  const dummy = { next: null };\n  let curr = dummy;\n  while (l1 && l2) {\n    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }\n    else { curr.next = l2; l2 = l2.next; }\n    curr = curr.next;\n  }\n  curr.next = l1 || l2;\n  return dummy.next;\n}',
    starterCode: {
      javascript: 'function mergeTwoLists(list1, list2) {\n  // Write your solution here\n}',
      python: 'def mergeTwoLists(list1, list2):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' },
      { input: '[1]', expectedOutput: '[[1]]' },
      { input: '[]', expectedOutput: '[]' },
    ],
    topic: 'Trees',
    description:
      "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: '' },
      { input: 'root = [1]', output: '[[1]]', explanation: '' },
    ],
    constraints: ['The number of nodes is in [0, 2000].', '-1000 <= Node.val <= 1000'],
    hints: ['Use BFS with a queue.', 'Process all nodes at each level before moving to the next.'],
    solution: 'function levelOrder(root) {\n  if (!root) return [];\n  const result = [], queue = [root];\n  while (queue.length) {\n    const level = [], size = queue.length;\n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      level.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    result.push(level);\n  }\n  return result;\n}',
    starterCode: {
      javascript: 'function levelOrder(root) {\n  // Write your solution here\n}',
      python: 'def levelOrder(root):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Implement Queue using Stacks',
    difficulty: 'Easy',
    topic: 'Queues',
    description:
      'Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support all the functions of a normal queue (push, peek, pop, and empty).',
    examples: [
      {
        input: '["MyQueue", "push", "push", "peek", "pop", "empty"]\n[[], [1], [2], [], [], []]',
        output: '[null, null, null, 1, 1, false]',
        explanation: '',
      },
    ],
    constraints: ['1 <= x <= 9', 'At most 100 calls will be made to push, pop, peek, and empty.'],
    hints: ['Use two stacks: one for push, one for pop.', 'Transfer elements between stacks when needed.'],
    solution: 'class MyQueue {\n  constructor() { this.s1 = []; this.s2 = []; }\n  push(x) { this.s1.push(x); }\n  pop() { if (!this.s2.length) while (this.s1.length) this.s2.push(this.s1.pop()); return this.s2.pop(); }\n  peek() { if (!this.s2.length) while (this.s1.length) this.s2.push(this.s1.pop()); return this.s2[this.s2.length-1]; }\n  empty() { return !this.s1.length && !this.s2.length; }\n}',
    testCases: [
      { input: 'push 1\npush 2\npeek', expectedOutput: '1' },
      { input: 'push 1\npush 2\npop', expectedOutput: '1' },
      { input: 'empty', expectedOutput: 'true' },
    ],
    starterCode: {
      javascript: 'class MyQueue {\n  constructor() {\n    // Initialize your data structure here\n  }\n  push(x) {}\n  pop() {}\n  peek() {}\n  empty() {}\n}',
      python: 'class MyQueue:\n    def __init__(self):\n        pass\n    def push(self, x):\n        pass\n    def pop(self):\n        pass\n    def peek(self):\n        pass\n    def empty(self):\n        pass',
      java: 'class MyQueue {\n    public MyQueue() {}\n    public void push(int x) {}\n    public int pop() {}\n    public int peek() {}\n    public boolean empty() {}\n}',
      cpp: 'class MyQueue {\npublic:\n    MyQueue() {}\n    void push(int x) {}\n    int pop() {}\n    int peek() {}\n    bool empty() {}\n};',
    },
  },
  {
    title: 'Longest Common Subsequence',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    description:
      'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.',
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'The longest common subsequence is "ace" and its length is 3.' },
      { input: 'text1 = "abc", text2 = "def"', output: '0', explanation: '' },
    ],
    constraints: ['1 <= text1.length, text2.length <= 1000', 'text1 and text2 consist of only lowercase English characters.'],
    hints: ['Use dynamic programming with a 2D table.', 'dp[i][j] = LCS length of text1[0..i-1] and text2[0..j-1].'],
    solution: 'function longestCommonSubsequence(t1, t2) {\n  const dp = Array(t1.length+1).fill(null).map(() => Array(t2.length+1).fill(0));\n  for (let i = 1; i <= t1.length; i++)\n    for (let j = 1; j <= t2.length; j++)\n      dp[i][j] = t1[i-1] === t2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);\n  return dp[t1.length][t2.length];\n}',
    testCases: [
      { input: 'abcde\nace', expectedOutput: '3' },
      { input: 'abc\ndef', expectedOutput: '0' },
      { input: 'aaa\naaa', expectedOutput: '3' },
    ],
    starterCode: {
      javascript: 'function longestCommonSubsequence(text1, text2) {\n  // Write your solution here\n}',
      python: 'def longestCommonSubsequence(text1, text2):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Number of Islands',
    difficulty: 'Medium',
    topic: 'Graphs',
    description:
      'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      {
        input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
        output: '1',
        explanation: '',
      },
      {
        input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]',
        output: '3',
        explanation: '',
      },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    hints: ['Use DFS or BFS to explore connected land cells.', 'Mark visited cells to avoid counting them twice.'],
    solution: 'function numIslands(grid) {\n  let count = 0;\n  function dfs(i, j) {\n    if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length || grid[i][j] === "0") return;\n    grid[i][j] = "0";\n    dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1);\n  }\n  for (let i = 0; i < grid.length; i++)\n    for (let j = 0; j < grid[0].length; j++)\n      if (grid[i][j] === "1") { count++; dfs(i,j); }\n  return count;\n}',
    testCases: [
      { input: '1 1 0\n1 1 0\n0 0 1', expectedOutput: '2' },
      { input: '1 1 0 0\n1 1 0 0\n0 0 1 0\n0 0 0 1', expectedOutput: '3' },
      { input: '0', expectedOutput: '0' },
    ],
    starterCode: {
      javascript: 'function numIslands(grid) {\n  // Write your solution here\n}',
      python: 'def numIslands(grid):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Valid Anagram',
    difficulty: 'Easy',
    topic: 'Strings',
    description:
      'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: '' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: '' },
    ],
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true' },
      { input: 'rat\ncar', expectedOutput: 'false' },
      { input: 'aab\naba', expectedOutput: 'true' },
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    hints: ['Count character frequencies.', 'Compare character counts of both strings.'],
    solution: 'function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const count = {};\n  for (const c of s) count[c] = (count[c] || 0) + 1;\n  for (const c of t) { count[c]--; if (count[c] < 0) return false; }\n  return true;\n}',
    starterCode: {
      javascript: 'function isAnagram(s, t) {\n  // Write your solution here\n}',
      python: 'def isAnagram(s, t):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '4', expectedOutput: '5' },
    ],
    topic: 'Dynamic Programming',
    description:
      'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1. 1+1+1\n2. 1+2\n3. 2+1' },
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['This is essentially a Fibonacci sequence problem.', 'dp[i] = dp[i-1] + dp[i-2]'],
    solution: 'function climbStairs(n) {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];\n  return b;\n}',
    starterCode: {
      javascript: 'function climbStairs(n) {\n  // Write your solution here\n}',
      python: 'def climbStairs(n):\n    # Write your solution here\n    pass',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n    }\n};',
    },
  },
  {
    title: 'Missing Number',
    difficulty: 'Easy',
    topic: 'Arrays',
    description:
      'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.',
    examples: [
      {
        input: 'nums = [3,0,1]',
        output: '2',
        explanation: 'n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number in the range since it does not appear in nums.',
      },
      {
        input: 'nums = [0,1]',
        output: '2',
        explanation: 'n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number in the range since it does not appear in nums.',
      },
      {
        input: 'nums = [9,6,4,2,3,5,7,0,1]',
        output: '8',
        explanation: 'n = 9 since there are 9 numbers, so all numbers are in the range [0,9]. 8 is the missing number in the range since it does not appear in nums.',
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
    ],
    starterCode: {
      javascript:
        'function missingNumber(nums) {\n  // Write your solution here\n}\n\nconst nums = require(\'fs\').readFileSync(0, \'utf-8\').trim().split(\' \').map(Number);\nconsole.log(missingNumber(nums));',
      python:
        'import sys\n\ndef missingNumber(nums):\n    # Write your solution here\n    pass\n\nnums = list(map(int, sys.stdin.read().strip().split()))\nprint(missingNumber(nums))',
      java:
        'import java.util.*;\nclass Solution {\n    public int missingNumber(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] parts = sc.nextLine().trim().split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        System.out.println(new Solution().missingNumber(nums));\n    }\n}',
      cpp:
        '#include <bits/stdc++.h>\nusing namespace std;\nclass Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};\nint main() {\n    vector<int> nums;\n    int x;\n    while (cin >> x) nums.push_back(x);\n    Solution sol;\n    cout << sol.missingNumber(nums) << endl;\n    return 0;\n}',
    },
  },
];

async function seed() {
  console.log('Seeding problems...');
  for (const problem of problems) {
    const ref = await db.collection('problems').add(problem);
    console.log(`  Added: ${problem.title} (${ref.id})`);
  }
  console.log('Done! Seeded', problems.length, 'problems.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
