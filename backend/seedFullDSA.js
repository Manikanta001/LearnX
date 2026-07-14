const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Course = require('./models/Course');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

const seedDSA = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to DB');

    let instructor = await User.findOne({ role: 'admin' });
    if (!instructor) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        instructor = await User.create({
            name: 'System Admin',
            email: 'admin@system.local',
            password: hashedPassword,
            firebaseUid: 'dummy_uid_admin',
            role: 'admin'
        });
    }

    console.log('Cleaning up old DSA courses and assignments...');
    const dsaTitles = [
        'Data Structures & Algorithms (DSA)',
        'Data Structures & Algorithms Masterclass'
    ];
    const coursesToDelete = await Course.find({ title: { $in: dsaTitles } });
    const courseIds = coursesToDelete.map(c => c._id);
    if (courseIds.length > 0) {
        await Quiz.deleteMany({ course: { $in: courseIds } });
        await Assignment.deleteMany({ course: { $in: courseIds } });
        await Enrollment.deleteMany({ course: { $in: courseIds } });
        await Certificate.deleteMany({ course: { $in: courseIds } });
    }
    await Course.deleteMany({ title: { $in: dsaTitles } });
    
    // Helper to create a specific Quiz
    const createSpecificQuiz = async (title, questions, courseId) => {
        const quiz = await Quiz.create({
            title,
            description: `Assessment for ${title}`,
            course: courseId,
            questions,
            duration: questions.length * 2, // 2 mins per question
            createdBy: instructor._id
        });
        return quiz._id.toString();
    };

    // Helper to create a specific Assignment
    const createSpecificAssignment = async (title, description, courseId, type = 'FileUpload') => {
        const assignment = await Assignment.create({
            title,
            description,
            course: courseId,
            type, // 'Coding', 'Text', 'FileUpload', 'MCQ'
            maxMarks: 100,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            instructions: 'Please provide detailed explanations and code snippets where necessary.',
            createdBy: instructor._id
        });
        return assignment._id.toString();
    };

    console.log('Generating Huge DSA Course...');
    const dsaCourse = new Course({
        title: 'Data Structures & Algorithms Masterclass',
        description: 'Complete DSA bootcamp from 0 to 100%. Master time complexity, arrays, strings, trees, graphs, and dynamic programming.',
        category: 'DSA',
        thumbnail: '/courses/dsa.png',
        instructor: instructor._id,
        difficulty: 'Hard',
        modules: []
    });

    const dsaContent = [
        {
            title: 'Introduction to DSA',
            content: `### Introduction to DSA\nLearn Time & Space Complexity, Big O notation...`,
            quiz: [
                { text: 'Which of the following describes Big O notation?', options: ['Upper Bound', 'Lower Bound', 'Tight Bound', 'Average Bound'], ans: 'Upper Bound' },
                { text: 'What is the time complexity of a single loop?', options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'], ans: 'O(n)' },
                { text: 'Which complexity is the most efficient?', options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(1)'], ans: 'O(1)' },
                { text: 'Space complexity includes...', options: ['Auxiliary space', 'Time spent', 'Network bandwidth', 'Disk usage'], ans: 'Auxiliary space' },
                { text: 'What does O(log n) mean?', options: ['Logarithmic time', 'Linear time', 'Exponential time', 'Quadratic time'], ans: 'Logarithmic time' }
            ],
            assignment: 'Write a short essay explaining the difference between Best Case, Worst Case, and Average Case Time Complexity with examples.'
        },
        {
            title: 'Arrays',
            content: `### Arrays\nMaster traversal, insertion, deletion, prefix sum...`,
            quiz: [
                { text: 'What is the time complexity to access an array element by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], ans: 'O(1)' },
                { text: 'Which technique is best for finding a subarray sum?', options: ['Prefix Sum', 'Binary Search', 'DFS', 'Matrix Exponentiation'], ans: 'Prefix Sum' },
                { text: 'What is the time complexity to insert at the beginning of an array?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], ans: 'O(n)' },
                { text: 'Which problem is solved using Sliding Window?', options: ['Maximum Sum Subarray of size K', 'Shortest Path', 'Tree Traversal', 'Graph Coloring'], ans: 'Maximum Sum Subarray of size K' },
                { text: 'In C++, std::vector is a...', options: ['Dynamic Array', 'Linked List', 'Binary Tree', 'Hash Map'], ans: 'Dynamic Array' }
            ],
            assignment: 'Implement an algorithm to reverse an array in-place. Provide the code in Python or Java.'
        },
        {
            title: 'Strings',
            content: `### Strings\nLearn Anagrams, Palindromes, KMP, Rabin Karp...`,
            quiz: [
                { text: 'A palindrome reads the same...', options: ['Forwards and backwards', 'Only forwards', 'Only backwards', 'Randomly'], ans: 'Forwards and backwards' },
                { text: 'Which algorithm is used for pattern matching?', options: ['KMP', 'Dijkstra', 'Floyd Warshall', 'Kruskal'], ans: 'KMP' },
                { text: 'Strings are immutable in which language?', options: ['Java', 'C', 'C++', 'Assembly'], ans: 'Java' },
                { text: 'Anagrams are two strings that...', options: ['Have the same characters with the same frequencies', 'Are identical', 'Have different characters', 'Are palindromes'], ans: 'Have the same characters with the same frequencies' },
                { text: 'What is the time complexity of the Naive string matching algorithm?', options: ['O(m*n)', 'O(m+n)', 'O(1)', 'O(log n)'], ans: 'O(m*n)' }
            ],
            assignment: 'Write a function to check if two strings are valid anagrams of each other. Explain your approach.'
        },
        {
            title: 'Linked Lists',
            content: `### Linked Lists\nMaster Singly, Doubly, Circular Linked Lists...`,
            quiz: [
                { text: 'What is a major advantage of a linked list over an array?', options: ['Dynamic size', 'O(1) access time', 'Contiguous memory', 'Cache locality'], ans: 'Dynamic size' },
                { text: 'A Doubly Linked List node contains...', options: ['Data, Prev pointer, Next pointer', 'Data, Next pointer', 'Data only', 'Data, Parent pointer'], ans: 'Data, Prev pointer, Next pointer' },
                { text: 'Which algorithm detects a cycle in a linked list?', options: ['Floyd’s Tortoise and Hare', 'KMP', 'Binary Search', 'Merge Sort'], ans: 'Floyd’s Tortoise and Hare' },
                { text: 'What is the time complexity to insert at the head of a linked list?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], ans: 'O(1)' },
                { text: 'Which data structure can be easily implemented using a Linked List?', options: ['Stack', 'Binary Search Tree', 'Segment Tree', 'Fenwick Tree'], ans: 'Stack' }
            ],
            assignment: 'Write code to reverse a Singly Linked List in O(n) time and O(1) space.'
        },
        {
            title: 'Stacks & Queues',
            content: `### Stacks & Queues\nLIFO, FIFO, Monotonic Stacks...`,
            quiz: [
                { text: 'A Stack follows which principle?', options: ['LIFO', 'FIFO', 'Random Access', 'Priority Based'], ans: 'LIFO' },
                { text: 'A Queue follows which principle?', options: ['FIFO', 'LIFO', 'Random Access', 'Priority Based'], ans: 'FIFO' },
                { text: 'Which problem is best solved using a Stack?', options: ['Balanced Parentheses', 'Shortest Path', 'Cycle Detection', 'Topological Sort'], ans: 'Balanced Parentheses' },
                { text: 'What is the time complexity of Push and Pop operations in a Stack?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], ans: 'O(1)' },
                { text: 'A Monotonic Stack is useful for finding...', options: ['Next Greater Element', 'Shortest Path', 'Minimum Spanning Tree', 'String Palindrome'], ans: 'Next Greater Element' }
            ],
            assignment: 'Implement a Queue using two Stacks. Provide the pseudo-code and explain the time complexity of the enqueue and dequeue operations.'
        },
        {
            title: 'Trees',
            content: `### Trees\nBinary Trees, BSTs, Heaps, Tries...`,
            quiz: [
                { text: 'In a BST, the left child is always...', options: ['Smaller than the parent', 'Larger than the parent', 'Equal to the parent', 'Null'], ans: 'Smaller than the parent' },
                { text: 'Which traversal visits nodes in ascending order in a BST?', options: ['Inorder', 'Preorder', 'Postorder', 'Level Order'], ans: 'Inorder' },
                { text: 'What is the height of a balanced binary tree with N nodes?', options: ['O(log N)', 'O(N)', 'O(1)', 'O(N^2)'], ans: 'O(log N)' },
                { text: 'A Max Heap ensures that...', options: ['Parent is greater than children', 'Left child is greater than right', 'Parent is smaller than children', 'Root is the smallest element'], ans: 'Parent is greater than children' },
                { text: 'Which data structure is best for prefix searches?', options: ['Trie', 'Heap', 'BST', 'Hash Map'], ans: 'Trie' }
            ],
            assignment: 'Write an algorithm to find the Lowest Common Ancestor (LCA) of two nodes in a Binary Tree.'
        },
        {
            title: 'Graphs',
            content: `### Graphs\nBFS, DFS, Dijkstra, Topo Sort...`,
            quiz: [
                { text: 'Which traversal algorithm uses a Queue?', options: ['BFS', 'DFS', 'Dijkstra', 'Kruskal'], ans: 'BFS' },
                { text: 'Which traversal algorithm uses a Stack?', options: ['DFS', 'BFS', 'Prim', 'Bellman Ford'], ans: 'DFS' },
                { text: 'Dijkstra’s Algorithm finds...', options: ['Shortest path from single source', 'All pairs shortest path', 'Minimum Spanning Tree', 'Maximum Flow'], ans: 'Shortest path from single source' },
                { text: 'Topological sorting is only possible on...', options: ['Directed Acyclic Graphs (DAG)', 'Undirected Graphs', 'Cyclic Graphs', 'Trees'], ans: 'Directed Acyclic Graphs (DAG)' },
                { text: 'Which algorithm finds a Minimum Spanning Tree?', options: ['Kruskal’s Algorithm', 'BFS', 'Floyd Warshall', 'Tarjan’s Algorithm'], ans: 'Kruskal’s Algorithm' }
            ],
            assignment: 'Explain the difference between Dijkstra\'s Algorithm and Bellman-Ford Algorithm. When would you use Bellman-Ford?'
        },
        {
            title: 'Dynamic Programming',
            content: `### Dynamic Programming\nMemoization, Tabulation, Knapsack...`,
            quiz: [
                { text: 'Dynamic Programming requires which two properties?', options: ['Overlapping Subproblems & Optimal Substructure', 'Recursion & Iteration', 'Greedy Choice & Backtracking', 'Divide & Conquer'], ans: 'Overlapping Subproblems & Optimal Substructure' },
                { text: 'Memoization is a...', options: ['Top-Down approach', 'Bottom-Up approach', 'Greedy approach', 'Graph traversal'], ans: 'Top-Down approach' },
                { text: 'Tabulation is a...', options: ['Bottom-Up approach', 'Top-Down approach', 'Backtracking method', 'Hashing technique'], ans: 'Bottom-Up approach' },
                { text: 'Which problem is a classic DP problem?', options: ['0/1 Knapsack', 'Binary Search', 'Merge Sort', 'Tree Traversal'], ans: '0/1 Knapsack' },
                { text: 'What is the time complexity of calculating Fibonacci(N) using DP?', options: ['O(N)', 'O(2^N)', 'O(1)', 'O(N^2)'], ans: 'O(N)' }
            ],
            assignment: 'Write the DP state transition equation for the Longest Common Subsequence (LCS) problem and provide the O(N*M) solution.'
        }
    ];

    for (const mod of dsaContent) {
        const lessons = [];
        
        // 1. Article Lesson
        lessons.push({
            title: `Explanation: ${mod.title}`,
            type: 'article',
            duration: 30,
            content: mod.content
        });

        // 2. Real Assignment Lesson
        const assignmentId = await createSpecificAssignment(`Practice Assignment: ${mod.title}`, mod.assignment, null, 'FileUpload');
        lessons.push({
            title: `Practice Assignment: ${mod.title}`,
            type: 'assignment',
            duration: 60,
            refId: assignmentId
        });

        // 3. Real Quiz Lesson (5 Questions)
        const formattedQuestions = mod.quiz.map(q => ({
            questionText: q.text,
            type: 'SingleCorrect',
            options: q.options,
            correctAnswers: [q.ans],
            explanation: `The correct answer is ${q.ans}.`
        }));
        const quizId = await createSpecificQuiz(`Practice Quiz: ${mod.title}`, formattedQuestions, null);
        lessons.push({
            title: `Practice Quiz: ${mod.title} (5 MCQs)`,
            type: 'quiz',
            duration: 10,
            refId: quizId
        });

        dsaCourse.modules.push({
            title: mod.title,
            description: `Master ${mod.title} with in-depth explanations and authentic practice.`,
            lessons
        });
    }
    
    // Create one final quiz at the end of the course with 15 questions
    const finalQuestionsRaw = [
        { text: 'What is the worst-case time complexity of QuickSort?', options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)'], ans: 'O(n^2)' },
        { text: 'Which data structure is used to implement a LRU Cache?', options: ['Hash Map + Doubly Linked List', 'Array', 'Binary Search Tree', 'Stack'], ans: 'Hash Map + Doubly Linked List' },
        { text: 'What is the space complexity of Depth First Search (DFS)?', options: ['O(V)', 'O(E)', 'O(V+E)', 'O(1)'], ans: 'O(V)' },
        { text: 'In DP, the 0/1 Knapsack problem can be solved in what time complexity?', options: ['O(N * W)', 'O(N^2)', 'O(2^N)', 'O(N log N)'], ans: 'O(N * W)' },
        { text: 'Which algorithm finds all pairs shortest path?', options: ['Floyd Warshall', 'Dijkstra', 'Bellman Ford', 'Kruskal'], ans: 'Floyd Warshall' },
        { text: 'What is the time complexity of searching in a perfectly balanced BST?', options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'], ans: 'O(log N)' },
        { text: 'A B-Tree is generally used for...', options: ['Database Indexing', 'Graph Traversal', 'String Matching', 'Sorting Arrays'], ans: 'Database Indexing' },
        { text: 'Which traversal of a BST gives a sorted array?', options: ['Inorder', 'Preorder', 'Postorder', 'Level Order'], ans: 'Inorder' },
        { text: 'What is the advantage of an Adjacency List over an Adjacency Matrix?', options: ['Saves space for sparse graphs', 'O(1) edge lookup', 'Easier to implement', 'Better for dense graphs'], ans: 'Saves space for sparse graphs' },
        { text: 'Which sorting algorithm is NOT stable?', options: ['QuickSort', 'MergeSort', 'InsertionSort', 'BubbleSort'], ans: 'QuickSort' },
        { text: 'A cycle in a directed graph can be detected using...', options: ['DFS + visited/recStack arrays', 'BFS only', 'Dijkstra', 'Kruskal'], ans: 'DFS + visited/recStack arrays' },
        { text: 'What is the time complexity of building a Max Heap?', options: ['O(N)', 'O(N log N)', 'O(log N)', 'O(N^2)'], ans: 'O(N)' },
        { text: 'Rabin-Karp algorithm uses which technique?', options: ['Rolling Hash', 'Dynamic Programming', 'Greedy', 'Divide and Conquer'], ans: 'Rolling Hash' },
        { text: 'Which problem is a classic application of the Greedy strategy?', options: ['Fractional Knapsack', '0/1 Knapsack', 'Longest Common Subsequence', 'Matrix Chain Multiplication'], ans: 'Fractional Knapsack' },
        { text: 'What is the maximum number of nodes in a binary tree of height H?', options: ['2^(H) - 1', '2^H', 'H^2', '2*H'], ans: '2^(H) - 1' }
    ];

    const formattedFinalQs = finalQuestionsRaw.map(q => ({
        questionText: q.text,
        type: 'SingleCorrect',
        options: q.options,
        correctAnswers: [q.ans],
        explanation: `The correct answer is ${q.ans}.`
    }));

    const dsaFinalQuizId = await createSpecificQuiz('DSA Final Assessment', formattedFinalQs, null);
    dsaCourse.finalAssessment = dsaFinalQuizId;
    await dsaCourse.save();
    console.log('✅ Authentic DSA course created successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDSA();
