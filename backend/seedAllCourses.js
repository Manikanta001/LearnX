const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Course = require('./models/Course');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

const seedAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB database.');

    // Find or create instructor
    let instructor = await User.findOne({ role: 'admin' });
    if (!instructor) {
      instructor = await User.findOne();
    }
    if (!instructor) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      instructor = await User.create({
        name: 'System Admin',
        email: 'admin@system.local',
        password: hashedPassword,
        firebaseUid: 'dummy_firebase_uid_seeder_all',
        role: 'admin'
      });
    }

    console.log('Clearing old courses, quizzes, assignments, enrollments, and certificates...');
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await Assignment.deleteMany({});
    await Enrollment.deleteMany({});
    await Certificate.deleteMany({});

    // Helper to create a specific Quiz
    const createQuizObj = async (title, questions, courseId) => {
      const formattedQs = questions.map((q, idx) => ({
        questionText: q.questionText,
        type: q.type || 'SingleCorrect',
        options: q.options,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation || `The correct answer is ${q.correctAnswers[0]}.`
      }));

      const quiz = await Quiz.create({
        title,
        description: `Assessment for ${title}`,
        course: courseId,
        questions: formattedQs,
        duration: questions.length * 2, // 2 mins per question
        createdBy: instructor._id
      });
      return quiz._id;
    };

    // =========================================================================
    // 1. Java Programming Course
    // =========================================================================
    console.log('Generating Java Programming Course...');
    const javaModulesList = [
      {
        title: 'Java Basics',
        desc: 'Introduction to Java, JDK, JRE, JVM, Variables, Data Types, Operators, Input & Output.',
        content: `### Module 1: Java Basics

Welcome to Java Programming! Java is a class-based, object-oriented programming language designed to have as few implementation dependencies as possible.

#### Key Concepts:
- **JDK (Java Development Kit):** Software development environment used for writing Java applications.
- **JRE (Java Runtime Environment):** Part of JDK that runs the program.
- **JVM (Java Virtual Machine):** Executes compiled Java bytecode.
- **Variables & Data Types:** Store data in primitive (int, double, char, boolean) or reference types.
- **Operators:** Arithmetic, relational, logical, and bitwise operations.
- **Input/Output:** Reading input from users using \`Scanner\` and writing output using \`System.out.println()\`.`
      },
      {
        title: 'Control Statements',
        desc: 'Working with conditional branches (if, else, switch) and loop structures (for, while, do-while).',
        content: `### Module 2: Control Statements

Learn to control the execution flow of your Java programs based on conditions and iterative loops.

#### Key Concepts:
- **Conditional Branches:** \`if\`, \`else if\`, \`else\` statements and \`switch\` blocks.
- **Loops:** Repeating execution using \`for\`, \`while\`, and \`do-while\` loops.
- **Jump Statements:** Using \`break\` to exit loops and \`continue\` to skip the current iteration.`
      },
      {
        title: 'Methods & Arrays',
        desc: 'Defining methods, applying recursion, handling arrays, and manipulating strings.',
        content: `### Module 3: Methods & Arrays

Structure your code into reusable sub-programs (methods) and manage contiguous data collections.

#### Key Concepts:
- **Methods:** Declaration, parameters, return types, and method overloading.
- **Recursion:** A method calling itself to solve smaller instances of the same problem.
- **Arrays:** Declaring, initializing, and accessing single-dimensional and multi-dimensional arrays.
- **Strings:** Manipulating immutable strings, and using \`StringBuilder\` or \`StringBuffer\` for mutable strings.`
      },
      {
        title: 'Object Oriented Programming',
        desc: 'Deep dive into the 4 pillars of OOP: Inheritance, Polymorphism, Abstraction, and Encapsulation.',
        content: `### Module 4: Object Oriented Programming (OOP)

Master the core paradigm of Java: designing applications using classes, objects, and OOP principles.

#### Key Concepts:
- **Classes & Objects:** Blueprints and their runtime instances.
- **Constructors:** Special methods to initialize new objects.
- **Encapsulation:** Hiding data using \`private\` variables and exposing them via public getters and setters.
- **Inheritance:** Code reuse through subclassing (\`extends\`).
- **Polymorphism:** Method overriding (runtime) and method overloading (compile-time).
- **Abstraction:** Hiding complexity using \`abstract\` classes and \`interfaces\`.`
      },
      {
        title: 'Exception Handling',
        desc: 'Writing robust error-resilient code using try, catch, finally, throw, and throws.',
        content: `### Module 5: Exception Handling

Handle runtime errors gracefully without crashing the application.

#### Key Concepts:
- **Exceptions:** Checked exceptions (compile-time) vs Unchecked exceptions (runtime).
- **Handling Blocks:** Enclosing risky code in \`try\` blocks, catching errors in \`catch\`, and cleaning up in \`finally\`.
- **Keywords:** Throwing exceptions manually using \`throw\`, and declaring exceptions in method signatures using \`throws\`.`
      },
      {
        title: 'Collections Framework',
        desc: 'Mastering dynamic data structures like Lists, Sets, Maps, Queues, Stacks, and Iterators.',
        content: `### Module 6: Collections Framework

Use Java's built-in framework to store and manipulate groups of objects efficiently.

#### Key Concepts:
- **List:** Ordered collections allowing duplicates (\`ArrayList\`, \`LinkedList\`).
- **Set:** Unordered collections ensuring unique elements (\`HashSet\`, \`TreeSet\`).
- **Map:** Key-value pairs for fast lookup (\`HashMap\`, \`TreeMap\`).
- **Queue & Stack:** FIFO and LIFO implementations.
- **Iterator:** Standard interface to traverse collection elements.`
      },
      {
        title: 'Multithreading',
        desc: 'Concurrent programming using Thread class, Runnable interface, synchronization, and avoiding deadlocks.',
        content: `### Module 7: Multithreading

Execute multiple execution paths concurrently to maximize CPU utilization.

#### Key Concepts:
- **Thread Creation:** Subclassing \`Thread\` or implementing \`Runnable\`.
- **Concurrency Issues:** Race conditions and how threads interact.
- **Synchronization:** Locking shared resources using the \`synchronized\` keyword.
- **Deadlock:** Situations where threads block each other indefinitely, and how to avoid them.`
      },
      {
        title: 'File Handling',
        desc: 'Reading and writing files using File class, streams, and saving objects with serialization.',
        content: `### Module 8: File Handling

Store data permanently on disk by reading and writing files.

#### Key Concepts:
- **File Class:** Inspecting file metadata and directory structures.
- **Streams:** Byte streams (\`FileInputStream\`, \`FileOutputStream\`) and Character streams (\`FileReader\`, \`FileWriter\`).
- **Serialization:** Converting Java objects into byte streams to save on disk or transmit over networks.`
      },
      {
        title: 'Java 8 Features',
        desc: 'Modern Java features: Lambda expressions, Stream API, Functional Interfaces, and Optional class.',
        content: `### Module 9: Java 8 Features

Java 8 revolutionized the language by introducing functional programming constructs.

#### Key Concepts:
- **Lambda Expressions:** Write anonymous functions concisely.
- **Stream API:** Perform functional-style operations (map, filter, reduce) on collections.
- **Functional Interfaces:** Interfaces containing exactly one abstract method (e.g., \`Predicate\`, \`Consumer\`).
- **Optional:** A container object that may or may not contain a non-null value, reducing \`NullPointerException\` occurrences.`
      },
      {
        title: 'JDBC & Mini Project',
        desc: 'Connecting Java programs to relational databases using JDBC and building a project.',
        content: `### Module 10: JDBC & Mini Project

Connect your Java applications to databases and apply your skills in a final mini-project.

#### Key Concepts:
- **JDBC (Java Database Connectivity):** Connecting to databases, creating statements, executing queries, and processing results.
- **Mini Project:** Combining OOP, exceptions, collections, and database connectivity into a cohesive console or GUI application.`
      }
    ];

    const javaQuestions = [
      { questionText: "Java is a", options: ["Platform", "Programming Language", "Operating System", "Database"], correctAnswers: ["Programming Language"] },
      { questionText: "JVM stands for", options: ["Java Virtual Machine", "Java Variable Manager", "Java Version Module", "Java Verification Machine"], correctAnswers: ["Java Virtual Machine"] },
      { questionText: "Which keyword creates an object?", options: ["create", "object", "new", "class"], correctAnswers: ["new"] },
      { questionText: "Which loop executes at least once?", options: ["for", "while", "do-while", "foreach"], correctAnswers: ["do-while"] },
      { questionText: "Parent class is also called", options: ["Base Class", "Child", "Object", "Interface"], correctAnswers: ["Base Class"] },
      { questionText: "Array index starts from", options: ["1", "0", "-1", "2"], correctAnswers: ["0"] },
      { questionText: "Which package contains ArrayList?", options: ["java.sql", "java.io", "java.util", "java.net"], correctAnswers: ["java.util"] },
      { questionText: "Exception superclass is", options: ["Error", "Throwable", "Object", "Runtime"], correctAnswers: ["Throwable"] },
      { questionText: "Which Java version introduced Lambda?", options: ["Java 5", "Java 6", "Java 8", "Java 17"], correctAnswers: ["Java 8"] },
      { questionText: "Which interface is implemented for multithreading?", options: ["Comparable", "Runnable", "Serializable", "Iterable"], correctAnswers: ["Runnable"] }
    ];

    const javaCourse = await Course.create({
      title: 'Java Programming Course',
      description: 'Master the fundamentals of Java programming from basic syntax and control flows, up to object-oriented programming (OOP), collections, multithreading, and Java 8 features.',
      category: 'Java',
      instructor: instructor._id,
      difficulty: 'Easy',
      thumbnail: '/courses/os.png',
      modules: []
    });

    const javaQuizId = await createQuizObj('Java Course Final Quiz', javaQuestions, javaCourse._id);

    javaModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 25, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'Java Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: javaQuizId.toString() });
      }
      javaCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    javaCourse.finalAssessment = javaQuizId;
    await javaCourse.save();
    console.log('Created Java Programming Course.');


    // =========================================================================
    // 2. Data Structures & Algorithms (DSA) Course
    // =========================================================================
    console.log('Generating Data Structures & Algorithms Course...');
    const dsaModulesList = [
      {
        title: 'Complexity Analysis',
        desc: 'Understanding Time Complexity, Space Complexity, and Big O notation.',
        content: `### Module 1: Time & Space Complexity

To write professional algorithms, we must understand how to measure their efficiency.

#### Key Concepts:
- **Time Complexity:** How running time grows with input size.
- **Space Complexity:** How extra memory grows with input size.
- **Big O Notation:** Describes the worst-case asymptotic upper bound of algorithms (e.g., O(1), O(log n), O(n), O(n log n), O(n^2)).`
      },
      {
        title: 'Arrays & Strings',
        desc: 'Manipulating sequential data, searching, and string parsing algorithms.',
        content: `### Module 2: Arrays & Strings

Arrays and strings form the foundation of most sequence processing algorithms.

#### Key Concepts:
- **Arrays:** Direct indexing, traversal, in-place reversion, and prefix sums.
- **Strings:** Palindromes, anagrams, frequency maps, pattern matching, and substring searches.`
      },
      {
        title: 'Linked List',
        desc: 'Singly, doubly, and circular linked lists; cycle detection algorithms.',
        content: `### Module 3: Linked List

Linked lists provide dynamic memory allocation and efficient modifications.

#### Key Concepts:
- **Singly Linked List:** Node structures, references, insertion, and deletion.
- **Doubly Linked List:** Bidirectional node pointers.
- **Cycle Detection:** Floyd's Tortoise and Hare algorithm to detect loops in pointer structures.`
      },
      {
        title: 'Stack & Queue',
        desc: 'LIFO and FIFO operations, stacks, queues, and custom applications.',
        content: `### Module 4: Stack & Queue

Stacks and queues represent strict ordering boundaries.

#### Key Concepts:
- **Stack (LIFO):** Push, pop, top operations; parentheses balancing, and evaluation of postfix expressions.
- **Queue (FIFO):** Enqueue, dequeue operations; buffer management, and standard message processing.`
      },
      {
        title: 'Trees, BST, Heap, Trie',
        desc: 'Hierarchical structures: Binary Trees, Binary Search Trees, Heaps, and Tries.',
        content: `### Module 5: Trees, BST, Heap, Trie

Explore non-linear structures designed for fast search and prioritization.

#### Key Concepts:
- **Binary Tree:** Node traversals (preorder, inorder, postorder).
- **BST (Binary Search Tree):** Fast search, insertion, and deletion operations.
- **Heap:** Binary heap properties for priority queues (Max Heap, Min Heap).
- **Trie:** Prefix tree for autocomplete and fast dictionary lookup.`
      },
      {
        title: 'Graph, BFS, DFS, Shortest Path',
        desc: 'Graph representations, breadth-first search, depth-first search, and shortest paths.',
        content: `### Module 6: Graph, BFS, DFS, Shortest Path

Graphs model complex networks of interconnected entities.

#### Key Concepts:
- **Representations:** Adjacency List and Adjacency Matrix.
- **Traversals:** BFS (using Queue) and DFS (using Recursion/Stack).
- **Shortest Path:** Dijkstra's single-source shortest path algorithm.`
      },
      {
        title: 'Searching',
        desc: 'Search algorithms: Linear Search and Binary Search.',
        content: `### Module 7: Searching

Find elements in collection arrays efficiently.

#### Key Concepts:
- **Linear Search:** Sequential checking with O(n) complexity.
- **Binary Search:** Divide-and-conquer strategy on sorted arrays with O(log n) complexity.`
      },
      {
        title: 'Sorting',
        desc: 'Sort algorithms: Bubble, Selection, Insertion, Merge, Quick, and Heap sort.',
        content: `### Module 8: Sorting

Arrange elements in ascending or descending order.

#### Key Concepts:
- **Simple Sorts:** Bubble Sort, Selection Sort, Insertion Sort (O(n^2)).
- **Efficient Sorts:** Merge Sort (stable), Quick Sort, and Heap Sort (O(n log n)).`
      },
      {
        title: 'Recursion & Backtracking',
        desc: 'Methods calling themselves and exploring all state possibilities (N-Queens, Sudoku).',
        content: `### Module 9: Recursion & Backtracking

Solve complex combinatorial issues using recursive state branches.

#### Key Concepts:
- **Recursion:** Base case vs recursive relations.
- **Backtracking:** Exploring paths and reverting changes when a dead-end is reached (e.g., N-Queens, Sudoku solver, Subsets generation).`
      },
      {
        title: 'Advanced Algorithmic Paradigms',
        desc: 'Dynamic Programming, Greedy approach, Sliding Window, and Two-Pointer techniques.',
        content: `### Module 10: Dynamic Programming & Advanced Paradigms

Solve optimization problems using advanced algorithmic styles.

#### Key Concepts:
- **Dynamic Programming (DP):** Overlapping subproblems, optimal substructure, memoization, and tabulation.
- **Greedy Algorithms:** Making locally optimal choices.
- **Two-Pointer:** Two index cursors moving through array sequence.
- **Sliding Window:** Maintaining subarray boundaries to optimize loops.`
      }
    ];

    const dsaQuestions = [
      { questionText: "What is the time complexity of Binary Search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswers: ["O(log n)"] },
      { questionText: "Stack follows", options: ["FIFO", "LIFO", "Random", "Priority"], correctAnswers: ["LIFO"] },
      { questionText: "Queue follows", options: ["FIFO", "LIFO", "Circular", "Random"], correctAnswers: ["FIFO"] },
      { questionText: "Which traversal uses Queue?", options: ["DFS", "BFS", "Inorder", "Postorder"], correctAnswers: ["BFS"] },
      { questionText: "What is the time complexity of Merge Sort?", options: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], correctAnswers: ["O(n log n)"] },
      { questionText: "Which data structure is naturally used in recursion call stack?", options: ["Queue", "Stack", "Heap", "Graph"], correctAnswers: ["Stack"] },
      { questionText: "A Binary Tree can have at maximum how many children per node?", options: ["1", "2", "3", "4"], correctAnswers: ["2"] },
      { questionText: "Heap is commonly used in which scenario?", options: ["Scheduling", "Searching", "Encryption", "Networking"], correctAnswers: ["Scheduling"] },
      { questionText: "Which algorithm finds the shortest path in a weighted graph?", options: ["Bubble Sort", "DFS", "Dijkstra", "Merge Sort"], correctAnswers: ["Dijkstra"] },
      { questionText: "Dynamic Programming avoids which bottleneck?", options: ["Sorting", "Duplicate calculations", "Searching", "Hashing"], correctAnswers: ["Duplicate calculations"] }
    ];

    const dsaCourse = await Course.create({
      title: 'Data Structures & Algorithms (DSA)',
      description: 'Master time complexities, arrays, lists, trees, graphs, and advanced algorithmic paradigms such as Dynamic Programming, Greedy, and Sliding Window.',
      category: 'DSA',
      instructor: instructor._id,
      difficulty: 'Hard',
      thumbnail: '/courses/dsa.png',
      modules: []
    });

    const dsaQuizId = await createQuizObj('DSA Course Final Quiz', dsaQuestions, dsaCourse._id);

    dsaModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 30, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'DSA Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: dsaQuizId.toString() });
      }
      dsaCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    dsaCourse.finalAssessment = dsaQuizId;
    await dsaCourse.save();
    console.log('Created DSA Course.');


    // =========================================================================
    // 3. Computer Networks Course
    // =========================================================================
    console.log('Generating Computer Networks Course...');
    const cnModulesList = [
      {
        title: 'Introduction & Types of Networks',
        desc: 'Overview of computer networks, LAN, WAN, PAN, MAN, and topologial layouts.',
        content: `### Module 1: Introduction & Types of Networks

Understand the fundamentals of how computers are connected to share resources and information.

#### Key Concepts:
- **LAN (Local Area Network):** Connects computers within a small geographic area.
- **WAN (Wide Area Network):** Covers large areas (e.g., the Internet).
- **PAN & MAN:** Personal Area Networks and Metropolitan Area Networks.
- **Topologies:** Layouts of networks (Star, Ring, Bus, Mesh).`
      },
      {
        title: 'OSI Model',
        desc: 'Deep dive into the 7-layer OSI model: Physical, Data Link, Network, Transport, Session, Presentation, Application.',
        content: `### Module 2: OSI Model

The Open Systems Interconnection (OSI) model divides communication functions into 7 logical layers.

#### Key Concepts:
- **Application, Presentation, Session Layers:** Deal with software formatting and dialog.
- **Transport Layer:** End-to-end reliability (TCP/UDP).
- **Network Layer:** Routing packets using IP addresses.
- **Data Link Layer:** Frame transfers using MAC addresses.
- **Physical Layer:** Hardware transmission (bits, copper, fiber).`
      },
      {
        title: 'TCP/IP Model',
        desc: 'Understanding the 4/5-layer TCP/IP suite compared with the OSI model.',
        content: `### Module 3: TCP/IP Model

The actual suite of protocols powering the modern Internet.

#### Key Concepts:
- **Four Layers:** Application, Transport, Internet, Network Access.
- **Comparison:** Mapping OSI layers to the streamlined TCP/IP standard.`
      },
      {
        title: 'IP Addressing & Subnetting',
        desc: 'IPv4, IPv6, CIDR notation, and allocating IP blocks via subnetting.',
        content: `### Module 4: IP Addressing & Subnetting

Master how packets are addressed and routed between networks.

#### Key Concepts:
- **IPv4 (32-bit):** Address classes, public vs private addresses.
- **IPv6 (128-bit):** Modern hexadecimal address format.
- **Subnetting:** Dividing IP spaces using subnet masks (CIDR).`
      },
      {
        title: 'Routing',
        desc: 'Routing algorithms (Dijkstra, Bellman-Ford) and protocols (OSPF, RIP, BGP).',
        content: `### Module 5: Routing

How routers decide the optimal path for a packet to reach its destination.

#### Key Concepts:
- **Interior Routing:** RIP (Distance Vector), OSPF (Link State, Dijkstra).
- **Exterior Routing:** BGP (Border Gateway Protocol) for routing between autonomous systems.`
      },
      {
        title: 'Switching',
        desc: 'Switch operations, VLANs, collision domains, and broadcast domains.',
        content: `### Module 6: Switching

Local packet transmission on layer 2.

#### Key Concepts:
- **Packet Switching vs Circuit Switching:** Dedicated lines vs packet blocks.
- **VLANs (Virtual LANs):** Segmenting logical networks on physical switches.`
      },
      {
        title: 'Transport Layer Protocols',
        desc: 'Comprehensive guide to TCP connection handshakes and UDP stream transfers.',
        content: `### Module 7: Transport Layer

End-to-end data transmission protocols.

#### Key Concepts:
- **TCP (Transmission Control Protocol):** Connection-oriented, 3-way handshake, flow control, reliable.
- **UDP (User Datagram Protocol):** Connectionless, low overhead, unreliable (fast).`
      },
      {
        title: 'Network Security',
        desc: 'Firewalls, encryption standards (SSL/TLS), and common network attack prevention.',
        content: `### Module 8: Network Security

Protecting data in transit and managing access controls.

#### Key Concepts:
- **SSL/TLS:** Handshakes, encryption keys, and HTTPS security.
- **Firewalls:** Packet filtering, stateful inspection, and intrusion prevention.`
      },
      {
        title: 'Wireless Networks',
        desc: 'Wi-Fi standards, frequencies, channels, and security protocols (WPA2, WPA3).',
        content: `### Module 9: Wireless Networks

Understanding wireless communications.

#### Key Concepts:
- **Wi-Fi Standards:** 802.11 protocols, bands, and channel allocation.
- **Wireless Security:** WEP, WPA2, WPA3 encryption protocols.`
      },
      {
        title: 'Network Troubleshooting',
        desc: 'Standard networking tools: ping, traceroute, nslookup, netstat, and Wireshark parsing.',
        content: `### Module 10: Network Troubleshooting

Standard command-line diagnostics to identify connection issues.

#### Key Concepts:
- **Ping:** Uses ICMP echo requests to verify host accessibility.
- **Traceroute:** Identifies routers/hops along the path.
- **NSLookup:** Queries DNS records.`
      }
    ];

    const cnQuestions = [
      { questionText: "How many layers are in the OSI model?", options: ["5", "6", "7", "8"], correctAnswers: ["7"] },
      { questionText: "HTTP uses which port by default?", options: ["20", "80", "22", "53"], correctAnswers: ["80"] },
      { questionText: "Which protocol is used by HTTPS to encrypt communications?", options: ["SSL/TLS", "FTP", "SMTP", "DNS"], correctAnswers: ["SSL/TLS"] },
      { questionText: "IP Addresses belong to which OSI layer?", options: ["Network Layer", "Transport Layer", "Session Layer", "Physical Layer"], correctAnswers: ["Network Layer"] },
      { questionText: "TCP is a protocol that is:", options: ["Connectionless", "Connection-oriented", "Wireless", "Broadcast"], correctAnswers: ["Connection-oriented"] },
      { questionText: "UDP protocol is:", options: ["Reliable", "Connection-oriented", "Connectionless", "Slow"], correctAnswers: ["Connectionless"] },
      { questionText: "What does DNS do?", options: ["Binary to Decimal", "Domain to IP", "IP to MAC", "MAC to IP"], correctAnswers: ["Domain to IP"] },
      { questionText: "Router works on which OSI layer?", options: ["Layer 1", "Layer 2", "Layer 3", "Layer 7"], correctAnswers: ["Layer 3"] },
      { questionText: "MAC Address belongs to which OSI layer?", options: ["Data Link", "Session", "Transport", "Application"], correctAnswers: ["Data Link"] },
      { questionText: "Ping uses which protocol?", options: ["HTTP", "ICMP", "FTP", "SMTP"], correctAnswers: ["ICMP"] }
    ];

    const cnCourse = await Course.create({
      title: 'Computer Networks',
      description: 'Complete guide to the OSI Model, TCP/IP, IP Addressing, Routing, and Security protocols.',
      category: 'Computer Network',
      instructor: instructor._id,
      difficulty: 'Medium',
      thumbnail: '/courses/cn.png',
      modules: []
    });

    const cnQuizId = await createQuizObj('CN Course Final Quiz', cnQuestions, cnCourse._id);

    cnModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 25, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'CN Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: cnQuizId.toString() });
      }
      cnCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    cnCourse.finalAssessment = cnQuizId;
    await cnCourse.save();
    console.log('Created Computer Networks Course.');


    // =========================================================================
    // 4. Operating System Course
    // =========================================================================
    console.log('Generating Operating System Course...');
    const osModulesList = [
      {
        title: 'OS Basics',
        desc: 'Overview of operating systems: kernel, shell, system calls, and boot sequences.',
        content: `### Module 1: OS Basics

Operating Systems manage hardware resources and provide services for programs.

#### Key Concepts:
- **Kernel & Shell:** Inner core (resource management) vs Outer wrapper (user interaction).
- **System Calls:** API enabling programs to request services from the kernel.`
      },
      {
        title: 'Processes',
        desc: 'Process lifecycle, process state transitions, context switching, and PCB.',
        content: `### Module 2: Processes

A process is a program in execution.

#### Key Concepts:
- **PCB (Process Control Block):** Kernel structure representing process state and data.
- **States:** New, Ready, Running, Waiting, Terminated.`
      },
      {
        title: 'Threads',
        desc: 'Thread models, concurrency, user-level vs kernel-level threads.',
        content: `### Module 3: Threads

Threads are lightweight execution paths inside a process.

#### Key Concepts:
- **Shared Memory:** Threads of the same process share code and data but maintain their own stacks.`
      },
      {
        title: 'CPU Scheduling',
        desc: 'FCFS, SJF, Round Robin, SRTF, and priority scheduling algorithms.',
        content: `### Module 4: CPU Scheduling

CPU scheduler selects ready processes for core execution.

#### Key Concepts:
- **FCFS (First Come First Serve):** Non-preemptive, suffers from Convoy Effect.
- **SJF (Shortest Job First):** Minimum average waiting time.
- **Round Robin:** Preemptive time-quantum scheduling.`
      },
      {
        title: 'Synchronization',
        desc: 'Critical sections, race conditions, semaphores, and mutex locks.',
        content: `### Module 5: Synchronization

Synchronizing concurrent access to shared resources to prevent corruption.

#### Key Concepts:
- **Race Condition:** Unpredictable values from overlapping execution.
- **Mutex:** Mutual exclusion lock primitive.`
      },
      {
        title: 'Deadlock',
        desc: 'Coffman conditions, Bankers algorithm, prevention, and detection.',
        content: `### Module 6: Deadlock

Deadlock happens when processes block each other indefinitely.

#### Key Concepts:
- **Four Coffman Conditions:** Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.
- **Banker's Algorithm:** Safety algorithm for Deadlock Avoidance.`
      },
      {
        title: 'Memory Management',
        desc: 'Contiguous allocation, paging structures, segmentation, fragmentation.',
        content: `### Module 7: Memory Management

How OS maps physical RAM to process address spaces.

#### Key Concepts:
- **Paging:** Fixed-size logical pages mapped to physical frames. Eliminates external fragmentation.`
      },
      {
        title: 'Virtual Memory',
        desc: 'Page faults, demand paging, LRU/FIFO page replacement, thrashing.',
        content: `### Module 8: Virtual Memory

Simulating extra RAM using disk spaces.

#### Key Concepts:
- **Page Fault:** CPU tries to access page not loaded in RAM.
- **Thrashing:** Continuous page faulting leading to severe slow downs.`
      },
      {
        title: 'File System',
        desc: 'File attributes, directories, allocation strategies (contiguous, indexed).',
        content: `### Module 9: File System

Structured disk storage mechanisms.

#### Key Concepts:
- **Allocation:** Contiguous, Linked, and Indexed (e.g. Inodes) filesystem blocks.`
      },
      {
        title: 'Disk Scheduling',
        desc: 'SSTF, FCFS, SCAN, C-SCAN head movement optimizations.',
        content: `### Module 10: Disk Scheduling

Optimizing disk read/write head movements.

#### Key Concepts:
- **SCAN & C-SCAN:** Elevator-like disk head traversals.`
      }
    ];

    const osQuestions = [
      { questionText: "CPU Scheduling selects which resource to execute next?", options: ["Memory", "Process", "File", "Network"], correctAnswers: ["Process"] },
      { questionText: "FCFS stands for", options: ["First Come First Serve", "First Copy First Save", "File Control", "Fast CPU Scheduling"], correctAnswers: ["First Come First Serve"] },
      { questionText: "How many Coffman conditions must hold simultaneously for a deadlock to occur?", options: ["One condition", "Four conditions", "Two conditions", "Five conditions"], correctAnswers: ["Four conditions"] },
      { questionText: "Virtual Memory uses what hardware as secondary storage fallback?", options: ["Hard Disk", "CPU", "Register", "Cache"], correctAnswers: ["Hard Disk"] },
      { questionText: "Semaphore is commonly used for", options: ["Networking", "Synchronization", "Compilation", "Printing"], correctAnswers: ["Synchronization"] },
      { questionText: "Paging solves which type of memory fragmentation?", options: ["Deadlock", "External Fragmentation", "Internal Fragmentation", "Scheduling"], correctAnswers: ["External Fragmentation"] },
      { questionText: "A Thread is also known as a", options: ["Lightweight Process", "Heavy Process", "File", "Memory"], correctAnswers: ["Lightweight Process"] },
      { questionText: "Round Robin CPU scheduling uses which core parameter?", options: ["Time Quantum", "FIFO", "Stack", "Queue only"], correctAnswers: ["Time Quantum"] },
      { questionText: "Which of the following scheduling algorithms is strictly non-preemptive?", options: ["FCFS", "Round Robin", "SRTF", "Priority (Preemptive)"], correctAnswers: ["FCFS"] },
      { questionText: "Banker's Algorithm is used to avoid which issue?", options: ["Paging", "Deadlock", "Scheduling", "Swapping"], correctAnswers: ["Deadlock"] }
    ];

    const osCourse = await Course.create({
      title: 'Operating System',
      description: 'Grasp process state transitions, thread models, CPU scheduling, lock synchronizations, paging systems, and deadlock handlings.',
      category: 'Operating System',
      instructor: instructor._id,
      difficulty: 'Medium',
      thumbnail: '/courses/os.png',
      modules: []
    });

    const osQuizId = await createQuizObj('OS Course Final Quiz', osQuestions, osCourse._id);

    osModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 25, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'OS Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: osQuizId.toString() });
      }
      osCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    osCourse.finalAssessment = osQuizId;
    await osCourse.save();
    console.log('Created Operating System Course.');


    // =========================================================================
    // 5. System Design Course
    // =========================================================================
    console.log('Generating System Design Course...');
    const sdModulesList = [
      {
        title: 'System Design Basics',
        desc: 'High-level architecture, client-server models, proxy servers.',
        content: `### Module 1: System Design Basics

Introduction to building enterprise-grade software architectures.

#### Key Concepts:
- **Proxy & Reverse Proxy:** Forwarding client requests and protecting internal web server pools.`
      },
      {
        title: 'Scalability',
        desc: 'Horizontal vs vertical scaling, stateless systems, replication.',
        content: `### Module 2: Scalability

How systems handle millions of active users.

#### Key Concepts:
- **Horizontal Scaling:** Adding more servers (scaling out).
- **Vertical Scaling:** Upgrading server hardware (scaling up).`
      },
      {
        title: 'Load Balancer',
        desc: 'Algorithms (Round Robin, IP-hash) and configurations for load routing.',
        content: `### Module 3: Load Balancers

Distributing incoming network traffic across multiple servers.

#### Key Concepts:
- **Algorithms:** Round Robin, Least Connections, IP Hashing.`
      },
      {
        title: 'Database Design',
        desc: 'SQL vs NoSQL databases, sharding, indexes, indexing strategies.',
        content: `### Module 4: Database Design

Choosing the right storage architecture.

#### Key Concepts:
- **SQL (Relational):** PostgreSQL, MySQL (ACID transactions).
- **NoSQL (Document/Key-Value):** MongoDB, Cassandra, Redis.`
      },
      {
        title: 'Caching',
        desc: 'LRU eviction, Redis in-memory storage, cache synchronization.',
        content: `### Module 5: Caching

Storing copies of hot data in fast memory.

#### Key Concepts:
- **In-memory cache:** Redis, Memcached.
- **Strategies:** Write-Through, Write-Back, Write-Around.`
      },
      {
        title: 'Message Queue',
        desc: 'Asynchronous event streaming using Kafka and RabbitMQ.',
        content: `### Module 6: Message Queue

Decoupling backend services via asynchronous messaging.

#### Key Concepts:
- **Pub/Sub Broker:** Apache Kafka, RabbitMQ.`
      },
      {
        title: 'Microservices',
        desc: 'Microservices communication patterns, API Gateways, service registries.',
        content: `### Module 7: Microservices

Splitting monolithic applications into fine-grained deployable services.`
      },
      {
        title: 'CAP Theorem',
        desc: 'Trade-offs: Consistency, Availability, Partition Tolerance.',
        content: `### Module 8: CAP Theorem

Distributed data systems must choose 2 out of 3 properties.

#### Key Concepts:
- **C-A-P:** Consistency, Availability, Partition Tolerance.`
      },
      {
        title: 'Distributed Systems',
        desc: 'Consensus algorithms, replication strategies, clock synchronizations.',
        content: `### Module 9: Distributed Systems

How multiple computing nodes coordinate to act as a single system.`
      },
      {
        title: 'Designing Real-world Applications',
        desc: 'Case studies: Designing URL Shortener, Twitter, Uber, Netflix.',
        content: `### Module 10: Designing Real-world Applications

Applying architectural patterns to interview case studies.`
      }
    ];

    const sdQuestions = [
      { questionText: "What does a Load Balancer distribute?", options: ["Database", "Traffic", "Memory", "Files"], correctAnswers: ["Traffic"] },
      { questionText: "Redis is commonly used as a:", options: ["Cache", "Database Driver", "Compiler", "Browser"], correctAnswers: ["Cache"] },
      { questionText: "Apache Kafka operates primarily as a:", options: ["Queue", "IDE", "OS", "Editor"], correctAnswers: ["Queue"] },
      { questionText: "CDN helps reduce which network metric?", options: ["Security", "Latency", "RAM", "CPU"], correctAnswers: ["Latency"] },
      { questionText: "Microservices communicate with each other using:", options: ["APIs", "Compiler", "JVM", "BIOS"], correctAnswers: ["APIs"] },
      { questionText: "Horizontal Scaling refers to:", options: ["Add Servers", "Upgrade CPU", "Upgrade RAM", "Upgrade Disk"], correctAnswers: ["Add Servers"] },
      { questionText: "How many active properties does CAP theorem allow a distributed database to maximize at once?", options: ["2 properties", "3 properties", "4 properties", "5 properties"], correctAnswers: ["2 properties"] },
      { questionText: "Database Replication directly improves which metric?", options: ["Availability", "Compilation", "Searching", "Programming"], correctAnswers: ["Availability"] },
      { questionText: "SQL databases are generally designed as:", options: ["Relational", "Graphical", "Cache", "Compiler"], correctAnswers: ["Relational"] },
      { questionText: "Caching primarily reduces what bottleneck?", options: ["Latency", "Memory", "CPU", "Storage"], correctAnswers: ["Latency"] }
    ];

    const sdCourse = await Course.create({
      title: 'System Design',
      description: 'Master scalability, database shardings, distributed cache setups, event-driven message queues, and real-world system architecture case studies.',
      category: 'System Design',
      instructor: instructor._id,
      difficulty: 'Hard',
      thumbnail: '/courses/sd.png',
      modules: []
    });

    const sdQuizId = await createQuizObj('System Design Course Final Quiz', sdQuestions, sdCourse._id);

    sdModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 25, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'System Design Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: sdQuizId.toString() });
      }
      sdCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    sdCourse.finalAssessment = sdQuizId;
    await sdCourse.save();
    console.log('Created System Design Course.');


    // =========================================================================
    // 6. QALR Course
    // =========================================================================
    console.log('Generating Quantitative Aptitude & Logical Reasoning Course...');
    const qaModulesList = [
      {
        title: 'Number System',
        desc: 'Divisibility rules, prime factorization, integers, LCM and HCF.',
        content: `### Module 1: Number System

Learn the mathematical behaviors of digits and sequences.

#### Key Concepts:
- **LCM & HCF:** Lowest Common Multiple and Highest Common Factor.
- **Divisibility:** Quick shortcuts to check divisors.`
      },
      {
        title: 'Percentage',
        desc: 'Fractions to percentages conversions, percentage increase and decrease.',
        content: `### Module 2: Percentage

Computing fractional parts of a base total.`
      },
      {
        title: 'Profit & Loss',
        desc: 'Cost Price, Selling Price, profit percentage, discounts, markups.',
        content: `### Module 3: Profit & Loss

Formulas:
- **Profit:** SP - CP.
- **Loss:** CP - SP.`
      },
      {
        title: 'Time & Work',
        desc: 'Work efficiency, group work rates, pipe and cistern systems.',
        content: `### Module 4: Time & Work

Inversely proportional relation between worker efficiency and time taken.`
      },
      {
        title: 'Time, Speed & Distance',
        desc: 'Relative speed, trains crossing, average speeds, unit conversions.',
        content: `### Module 5: Time, Speed & Distance

Formulas:
- **Speed:** Distance / Time.`
      },
      {
        title: 'Ratio & Proportion',
        desc: 'Ratios, compound ratios, properties of proportions.',
        content: `### Module 6: Ratio & Proportion

Comparing relative size values.`
      },
      {
        title: 'Probability',
        desc: 'Simple event probabilities, coin tosses, card draws, dice rolls.',
        content: `### Module 7: Probability

Likelihood of event occurrences: range from 0 to 1.`
      },
      {
        title: 'Permutation & Combination',
        desc: 'Factorials, sorting arrangements, groups selection (nCr, nPr).',
        content: `### Module 8: Permutation & Combination

Sorting and selecting element combinations.`
      },
      {
        title: 'Puzzles',
        desc: 'Analytical grid puzzles, missing sequence items, logical deductions.',
        content: `### Module 9: Puzzles

Strengthening cognitive logic capabilities.`
      },
      {
        title: 'Logical Reasoning',
        desc: 'Blood relations, coding-decoding alphabets, seating arrangements.',
        content: `### Module 10: Logical Reasoning

Analyzing positional orders, code patterns, and family trees.`
      }
    ];

    const qaQuestions = [
      { questionText: "20% of 500 is equal to:", options: ["80", "100", "120", "150"], correctAnswers: ["100"] },
      { questionText: "The ratio 15:20 simplifies to:", options: ["2:3", "3:4", "4:5", "5:6"], correctAnswers: ["3:4"] },
      { questionText: "Probability values always lie between which numbers?", options: ["0 and 1", "1 and 10", "-1 and 1", "0 and 100"], correctAnswers: ["0 and 1"] },
      { questionText: "What is the average of 2, 4, and 6?", options: ["2", "3", "4", "5"], correctAnswers: ["4"] },
      { questionText: "Speed is equal to which formula?", options: ["Distance × Time", "Distance ÷ Time", "Time ÷ Distance", "Distance + Time"], correctAnswers: ["Distance ÷ Time"] },
      { questionText: "Identify the odd one out: 2, 4, 8, 16, 18", options: ["2", "8", "16", "18"], correctAnswers: ["18"] },
      { questionText: "If CAT is coded as DBU, then DOG is coded as:", options: ["EPH", "DPH", "EOG", "EPI"], correctAnswers: ["EPH"] },
      { questionText: "The father of my father is my:", options: ["Uncle", "Grandfather", "Brother", "Cousin"], correctAnswers: ["Grandfather"] },
      { questionText: "Profit is calculated as:", options: ["CP − SP", "SP − CP", "CP + SP", "SP × CP"], correctAnswers: ["SP − CP"] },
      { questionText: "Which logical reasoning topic commonly involves arranging people in relative positions?", options: ["Percentage", "Seating Arrangement", "Probability", "Ratio"], correctAnswers: ["Seating Arrangement"] }
    ];

    const qaCourse = await Course.create({
      title: 'QALR (Quantitative Aptitude & Logical Reasoning)',
      description: 'Strengthen mathematical problem solving and logical analysis. Covers arithmetic, probability, combinatorics, blood relations, and seating arrangements.',
      category: 'Aptitude',
      instructor: instructor._id,
      difficulty: 'Easy',
      thumbnail: '/courses/quant.png',
      modules: []
    });

    const qaQuizId = await createQuizObj('QALR Course Final Quiz', qaQuestions, qaCourse._id);

    qaModulesList.forEach((m, idx) => {
      const lessons = [
        { title: `Explanation: ${m.title}`, type: 'article', duration: 25, content: m.content }
      ];
      if (idx === 9) {
        lessons.push({ title: 'QALR Course Final Assessment Quiz (10 MCQs)', type: 'quiz', duration: 15, refId: qaQuizId.toString() });
      }
      qaCourse.modules.push({ title: `Module ${idx + 1}: ${m.title}`, description: m.desc, lessons });
    });

    qaCourse.finalAssessment = qaQuizId;
    await qaCourse.save();
    console.log('Created QALR Course.');

    console.log('✅ Seeding all courses completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedAllData();
