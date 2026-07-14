require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Problem = require('../models/Problem');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');

const fallbackProblems = require('../models/defaultProblems');

const seed = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx';
    console.log('Connecting to database:', connUri);
    await mongoose.connect(connUri);

    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await Assignment.deleteMany({});

    console.log('Seeding Users (Instructor and Admin)...');
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedInstructorPassword = await bcrypt.hash('instructor123', salt);
    const hashedStudentPassword = await bcrypt.hash('student123', salt);

    const admin = new User({
      name: 'LearnX Admin',
      email: 'admin@learnx.com',
      password: hashedAdminPassword,
      role: 'admin',
      xp: 500,
    });
    await admin.save();

    const instructor = new User({
      name: 'Professor Manikanta',
      email: 'instructor@learnx.com',
      password: hashedInstructorPassword,
      role: 'instructor',
      xp: 350,
      bio: 'DSA specialist and Senior Educator.',
      education: 'Ph.D. in Computer Science',
      skills: ['Algorithms', 'Java', 'Python', 'C++'],
    });
    await instructor.save();

    const student = new User({
      name: 'John Doe',
      email: 'student@learnx.com',
      password: hashedStudentPassword,
      role: 'student',
      xp: 0,
      streak: 0,
      solveHistory: new Map(),
    });
    await student.save();

    console.log(`Seeding Problems (Count: ${fallbackProblems.length})...`);
    const seededProblems = [];
    for (const prob of fallbackProblems) {
      const p = new Problem({
        title: prob.title,
        difficulty: prob.difficulty,
        topic: prob.topic,
        source: prob.source || 'custom',
        sourceUrl: prob.sourceUrl || '',
        description: prob.description,
        examples: prob.examples || [],
        constraints: prob.constraints || [],
        hints: prob.hints || [],
        testCases: prob.testCases || [],
        starterCode: prob.starterCode || {
          javascript: 'function solve() {}',
          python: 'def solve(): pass',
          java: 'class Solution {}',
          cpp: 'class Solution {};'
        },
        executionWrapper: prob.executionWrapper || {
          javascript: '',
          python: '',
          java: '',
          cpp: ''
        },
        solution: prob.solution || '',
        editorial: prob.editorial || '',
        tags: [prob.topic],
        createdBy: admin._id.toString(),
      });
      await p.save();
      seededProblems.push(p);
    }
    console.log('Successfully seeded problems.');

    // Seed Quiz
    console.log('Seeding Sample Quiz...');
    const quiz = new Quiz({
      title: 'Arrays & Lists Assessment',
      description: 'Test your understanding of array memory allocation, traversals, and lookups.',
      duration: 10,
      maxAttempts: 3,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      pointsPerQuestion: 10,
      createdBy: instructor._id,
      questions: [
        {
          questionText: 'What is the time complexity of accessing an element in an array by its index?',
          type: 'SingleCorrect',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctAnswers: ['O(1)'],
          explanation: 'Arrays allocate contiguous memory blocks. Element address is computed mathematically in O(1) time.',
        },
        {
          questionText: 'Which of the following operations are linear O(N) time complexity for an array?',
          type: 'MultipleCorrect',
          options: ['Inserting an element at the beginning', 'Retrieving the first element', 'Searching for an element (unsorted)', 'Deleting the last element'],
          correctAnswers: ['Inserting an element at the beginning', 'Searching for an element (unsorted)'],
          explanation: 'Inserting at the beginning requires shifting all elements. Searching requires scanning the entire array in worst case.',
        },
        {
          questionText: 'True or False: A dynamic array dynamically doubles its capacity when it becomes full.',
          type: 'TrueFalse',
          options: ['True', 'False'],
          correctAnswers: ['True'],
          explanation: 'Dynamic arrays (like ArrayList in Java or Vector in C++) double their capacity on overflow to achieve amortized O(1) insertion.',
        }
      ]
    });
    await quiz.save();

    // Seed Assignment
    console.log('Seeding Sample Assignments...');
    const assignmentMcq = new Assignment({
      title: 'Algorithmic Complexity MCQ',
      description: 'Complete the multiple choice assessment on asymptotic notations.',
      type: 'MCQ',
      maxMarks: 50,
      deadline: new Date(Date.now() + 10 * 86400000), // 10 days from now
      instructions: 'Please answer all multiple-choice questions carefully. This assignment is auto-graded.',
      mcqQuestions: [
        {
          questionText: 'What is the time complexity of binary search on a sorted array?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
          correctAnswer: '1', // Index 1: O(log N)
        },
        {
          questionText: 'Which function grows fastest as N becomes large?',
          options: ['N log N', 'N^2', '2^N', 'N!'],
          correctAnswer: '3', // Index 3: N!
        }
      ],
      createdBy: instructor._id,
    });
    await assignmentMcq.save();

    const assignmentCoding = new Assignment({
      title: 'Coding Challenge: Two Sum',
      description: 'Implement the Two Sum solution and achieve O(N) time complexity.',
      type: 'Coding',
      maxMarks: 100,
      deadline: new Date(Date.now() + 14 * 86400000), // 2 weeks from now
      instructions: 'Write your solution in Javascript or Python. Correctness and time complexity are both graded.',
      codingProblem: seededProblems.find(p => p.title === 'Two Sum')?._id || seededProblems[0]._id,
      createdBy: instructor._id,
    });
    await assignmentCoding.save();

    const assignmentFile = new Assignment({
      title: 'Custom Stack Implementation Report',
      description: 'Write a comprehensive report comparing Array and Linked List stack performances.',
      type: 'FileUpload',
      maxMarks: 100,
      deadline: new Date(Date.now() + 7 * 86400000),
      instructions: 'Analyze time-space trade-offs. Upload a PDF document.',
      fileRequirements: 'PDF format, max 5MB',
      createdBy: instructor._id,
    });
    await assignmentFile.save();

    // Seed Courses
    console.log('Seeding Sample Course...');
    const course = new Course({
      title: 'Mastering Data Structures & Algorithms',
      description: 'Comprehensive course taking you from absolute basics to advanced graph algorithms. Features video lessons, download notes, practical coding assignments, and module quizzes.',
      category: 'Computer Science',
      difficulty: 'Easy',
      thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=600&auto=format&fit=crop',
      instructor: instructor._id,
      modules: [
        {
          title: 'Module 1: Array Foundations & Searching',
          description: 'Master linear memory and search operations.',
          lessons: [
            {
              title: 'Lesson 1.1: Core Array Allocations',
              type: 'video',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              content: 'In this video, we explore how arrays allocate contiguous slots of memory and why lookup is O(1).',
              duration: 12,
            },
            {
              title: 'Lesson 1.2: Download PDF - Array Operations Study Notes',
              type: 'pdf',
              notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              content: 'These study notes summarize element insertion, deletion, and search algorithms.',
              duration: 5,
            },
            {
              title: 'Lesson 1.3: Assessment - Arrays Quiz',
              type: 'quiz',
              refId: quiz._id.toString(),
              content: 'Attempt the quiz on Array structures and memory metrics.',
              duration: 10,
            },
            {
              title: 'Lesson 1.4: Assignment - Complexity MCQ Practice',
              type: 'assignment',
              refId: assignmentMcq._id.toString(),
              content: 'Solve the multiple-choice questions on asymptotic complexity.',
              duration: 15,
            }
          ]
        },
        {
          title: 'Module 2: Coding Challenges Practice',
          description: 'Submit your solution for live compiler evaluation.',
          lessons: [
            {
              title: 'Lesson 2.1: Practice Challenge - Two Sum Problem',
              type: 'assignment',
              refId: assignmentCoding._id.toString(),
              content: 'Submit a valid O(N) HashMap solution for the Two Sum problem.',
              duration: 45,
            },
            {
              title: 'Lesson 2.2: Research Assignment - Stack Report',
              type: 'assignment',
              refId: assignmentFile._id.toString(),
              content: 'Perform performance analyses on stack operations.',
              duration: 60,
            }
          ]
        }
      ]
    });
    await course.save();

    // Link quiz and assignments back to course
    quiz.course = course._id;
    await quiz.save();

    assignmentMcq.course = course._id;
    await assignmentMcq.save();

    assignmentCoding.course = course._id;
    await assignmentCoding.save();

    assignmentFile.course = course._id;
    await assignmentFile.save();

    console.log('Course, Quiz, and Assignments successfully linked.');
    console.log('Database Seeding Completed Successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
