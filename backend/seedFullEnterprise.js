const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

const seedEnterprise = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to DB');

    let instructor = await User.findOne({ role: 'admin' });

    console.log('Cleaning up old OS, CN, SD, QALR courses and assignments...');
    const titlesToDelete = [
      'Operating System',
      'Operating Systems Mastery',
      'Operating Systems Essentials',
      'Computer Networks',
      'Computer Networks Fundamentals',
      'System Design',
      'System Design for Interviews',
      'QALR (Quantitative Aptitude & Logical Reasoning)',
      'Quantitative Aptitude & Logical Reasoning',
      'Quantitative Aptitude Masterclass'
    ];
    const coursesToDelete = await Course.find({ title: { $in: titlesToDelete } });
    const courseIds = coursesToDelete.map(c => c._id);
    if (courseIds.length > 0) {
        await Quiz.deleteMany({ course: { $in: courseIds } });
        await Assignment.deleteMany({ course: { $in: courseIds } });
        await Enrollment.deleteMany({ course: { $in: courseIds } });
        await Certificate.deleteMany({ course: { $in: courseIds } });
    }
    await Course.deleteMany({ title: { $in: titlesToDelete } });
    
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
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            instructions: 'Please provide detailed explanations for the case studies.',
            createdBy: instructor._id
        });
        return assignment._id.toString();
    };

    // =========================================================================
    // 1. Operating Systems Course
    // =========================================================================
    console.log('Generating Operating Systems Course...');
    const osCourse = new Course({
        title: 'Operating Systems Mastery',
        description: 'Deep dive into process scheduling, memory management, deadlocks, and file systems.',
        category: 'Operating System',
        thumbnail: '/courses/os.png',
        instructor: instructor._id,
        difficulty: 'Medium',
        modules: []
    });
    
    const osContentMap = [
        {
            title: 'Processes', 
            content: `### Processes in OS\nA process is essentially a program in execution...`,
            quiz: [
                { text: 'Which state is a process in when it is waiting for an I/O event?', options: ['Ready', 'Running', 'Waiting', 'Terminated'], ans: 'Waiting' },
                { text: 'What is a PCB?', options: ['Printed Circuit Board', 'Process Control Block', 'Program Counter Block', 'Process Central Block'], ans: 'Process Control Block' },
                { text: 'Which of the following is NOT part of a PCB?', options: ['Process State', 'Program Counter', 'CPU Registers', 'Browser Cache'], ans: 'Browser Cache' },
                { text: 'Context switching is performed by...', options: ['User', 'OS Scheduler', 'Hardware alone', 'Compiler'], ans: 'OS Scheduler' },
                { text: 'Orphan processes are adopted by...', options: ['Init process', 'Zombie process', 'Kernel', 'No one'], ans: 'Init process' }
            ],
            assignment: 'Explain the difference between a Process and a Thread in detail.'
        },
        {
            title: 'Threads', 
            content: `### Threads in OS\nA thread is a basic unit of CPU utilization...`,
            quiz: [
                { text: 'Threads of the same process share...', options: ['Stack', 'Registers', 'Code and Data Section', 'Program Counter'], ans: 'Code and Data Section' },
                { text: 'Which is faster to create?', options: ['Process', 'Thread', 'Both take same time', 'Depends on RAM'], ans: 'Thread' },
                { text: 'What happens if a user-level thread blocks?', options: ['Entire process blocks', 'Only that thread blocks', 'OS crashes', 'Another thread is spawned'], ans: 'Entire process blocks' },
                { text: 'Kernel threads are managed by...', options: ['User Library', 'Operating System', 'Compiler', 'Hardware'], ans: 'Operating System' },
                { text: 'Multithreading improves...', options: ['Responsiveness', 'Memory usage', 'Disk Space', 'Network bandwidth'], ans: 'Responsiveness' }
            ],
            assignment: 'Compare User-Level Threads and Kernel-Level Threads.'
        },
        {
            title: 'Scheduling Algorithms', 
            content: `### CPU Scheduling\nCPU scheduling is the basis of multiprogrammed OS...`,
            quiz: [
                { text: 'Which algorithm is best for time-sharing?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority'], ans: 'Round Robin' },
                { text: 'The Convoy Effect is associated with...', options: ['FCFS', 'Round Robin', 'SJF', 'Multilevel Queue'], ans: 'FCFS' },
                { text: 'Which algorithm guarantees the minimum average waiting time?', options: ['SJF', 'FCFS', 'Priority', 'Round Robin'], ans: 'SJF' },
                { text: 'What solves starvation in Priority Scheduling?', options: ['Aging', 'Paging', 'Deadlock', 'Mutex'], ans: 'Aging' },
                { text: 'Time quantum is a parameter in...', options: ['SJF', 'Round Robin', 'FCFS', 'Priority'], ans: 'Round Robin' }
            ],
            assignment: 'Calculate Average Waiting Time for processes [P1=10ms, P2=5ms, P3=2ms] using SJF.'
        },
        {
            title: 'Deadlocks', 
            content: `### Deadlocks\nA deadlock occurs when processes are blocked...`,
            quiz: [
                { text: 'Which is NOT a necessary condition for deadlock?', options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait'], ans: 'Preemption' },
                { text: 'Banker’s Algorithm is used for...', options: ['Deadlock Prevention', 'Deadlock Avoidance', 'Deadlock Detection', 'CPU Scheduling'], ans: 'Deadlock Avoidance' },
                { text: 'A system is safe if...', options: ['There is no deadlock', 'There is a safe sequence', 'CPU utilization is 100%', 'Memory is full'], ans: 'There is a safe sequence' },
                { text: 'Wait-for graphs are used for...', options: ['Deadlock Detection', 'Scheduling', 'Paging', 'Networking'], ans: 'Deadlock Detection' },
                { text: 'How to prevent Circular Wait?', options: ['Order resources linearly', 'Allow preemption', 'Spooling', 'Aging'], ans: 'Order resources linearly' }
            ],
            assignment: 'Given a resource allocation state, determine if it is in a Safe State using Banker\'s Algorithm.'
        },
        {
            title: 'Memory Management', 
            content: `### Memory Management & Paging\nMemory management keeps track of memory...`,
            quiz: [
                { text: 'Paging eliminates...', options: ['Internal Fragmentation', 'External Fragmentation', 'Thrashing', 'Page Faults'], ans: 'External Fragmentation' },
                { text: 'Logical memory is divided into...', options: ['Frames', 'Pages', 'Segments', 'Blocks'], ans: 'Pages' },
                { text: 'A Page Fault occurs when...', options: ['Page is found in memory', 'Page is not in RAM', 'RAM is full', 'CPU crashes'], ans: 'Page is not in RAM' },
                { text: 'Thrashing means...', options: ['OS is running smoothly', 'High CPU utilization', 'Process spends more time paging than executing', 'Deadlock'], ans: 'Process spends more time paging than executing' },
                { text: 'Which page replacement algorithm suffers from Belady’s Anomaly?', options: ['LRU', 'FIFO', 'Optimal', 'LFU'], ans: 'FIFO' }
            ],
            assignment: 'Explain Virtual Memory and how Page Replacement algorithms handle Page Faults.'
        }
    ];

    for (const mod of osContentMap) {
        const lessons = [];
        lessons.push({ title: `Explanation: ${mod.title}`, type: 'article', duration: 25, content: mod.content });
        
        const assignmentId = await createSpecificAssignment(`Assignment: ${mod.title}`, mod.assignment, null);
        lessons.push({ title: `Assignment: ${mod.title}`, type: 'assignment', duration: 30, refId: assignmentId });
        
        const formattedQuestions = mod.quiz.map(q => ({
            questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans], explanation: `Answer is ${q.ans}`
        }));
        const quizId = await createSpecificQuiz(`Quiz: ${mod.title}`, formattedQuestions, null);
        lessons.push({ title: `Quiz: ${mod.title} (5 MCQs)`, type: 'quiz', duration: 10, refId: quizId });

        osCourse.modules.push({ title: mod.title, lessons });
    }
    const osFinalQs = [
        { text: 'What is a Semaphore?', options: ['Hardware', 'Variable used for sync', 'OS Scheduler', 'Network Protocol'], ans: 'Variable used for sync' },
        { text: 'What causes Thrashing?', options: ['Too much RAM', 'Lack of frames', 'Fast CPU', 'Good scheduling'], ans: 'Lack of frames' },
        { text: 'What is a Zombie Process?', options: ['Process that eats RAM', 'Terminated process whose parent hasn\'t read exit status', 'Orphan process', 'Malware'], ans: 'Terminated process whose parent hasn\'t read exit status' },
        { text: 'What does the \'fork()\' system call do?', options: ['Creates a new process', 'Terminates a process', 'Reads a file', 'Allocates memory'], ans: 'Creates a new process' },
        { text: 'What is Context Switching?', options: ['Switching monitors', 'Saving state of old process & loading new one', 'Changing passwords', 'Rebooting OS'], ans: 'Saving state of old process & loading new one' },
        { text: 'Which scheduler controls degree of multiprogramming?', options: ['Short-term', 'Medium-term', 'Long-term', 'Disk scheduler'], ans: 'Long-term' },
        { text: 'A Mutex provides...', options: ['Multiple access', 'Mutual Exclusion', 'Deadlock', 'Thrashing'], ans: 'Mutual Exclusion' },
        { text: 'What is Belady\'s Anomaly?', options: ['More frames = More page faults', 'Less frames = More page faults', 'Deadlock in DB', 'Cache miss'], ans: 'More frames = More page faults' },
        { text: 'Which is non-preemptive?', options: ['Round Robin', 'FCFS', 'SRTF', 'Priority'], ans: 'FCFS' },
        { text: 'What maps logical to physical addresses?', options: ['MMU', 'ALU', 'CPU', 'RAM'], ans: 'MMU' },
        { text: 'Translation Lookaside Buffer (TLB) is a...', options: ['Hard drive', 'Cache for page table', 'Network router', 'Process'], ans: 'Cache for page table' },
        { text: 'A thread does NOT share...', options: ['Code', 'Data', 'Stack', 'Heap'], ans: 'Stack' },
        { text: 'Which prevents deadlock?', options: ['Bankers Algo', 'Circular Wait elimination', 'Wait for graph', 'Ostrich algo'], ans: 'Circular Wait elimination' },
        { text: 'What is Spooling?', options: ['Simultaneous Peripheral Operations On-Line', 'Spinning a disk', 'Scheduling', 'Paging'], ans: 'Simultaneous Peripheral Operations On-Line' },
        { text: 'Which is fastest?', options: ['L1 Cache', 'RAM', 'SSD', 'HDD'], ans: 'L1 Cache' }
    ].map(q => ({ questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans] }));

    const osFinalQuizId = await createSpecificQuiz('OS Final Assessment', osFinalQs, null);
    osCourse.finalAssessment = osFinalQuizId;
    await osCourse.save();


    // =========================================================================
    // 2. Computer Networks Course
    // =========================================================================
    console.log('Generating Computer Networks Course...');
    const cnCourse = new Course({
        title: 'Computer Networks Fundamentals',
        description: 'Complete guide to the OSI Model, TCP/IP, IP Addressing, Routing, and Security.',
        category: 'Computer Network',
        thumbnail: '/courses/cn.png',
        instructor: instructor._id,
        difficulty: 'Medium',
        modules: []
    });
    
    const cnContentMap = [
        {
            title: 'OSI Model', 
            content: `### The OSI Model\nThe OSI model characterizes...`,
            quiz: [
                { text: 'How many layers in OSI?', options: ['5', '6', '7', '8'], ans: '7' },
                { text: 'Which layer handles routing?', options: ['Data Link', 'Network', 'Transport', 'Physical'], ans: 'Network' },
                { text: 'MAC addresses are used at which layer?', options: ['Physical', 'Data Link', 'Network', 'Application'], ans: 'Data Link' },
                { text: 'HTTP operates at which layer?', options: ['Application', 'Transport', 'Network', 'Session'], ans: 'Application' },
                { text: 'Which layer ensures reliable end-to-end delivery?', options: ['Network', 'Transport', 'Session', 'Data Link'], ans: 'Transport' }
            ],
            assignment: 'Map the TCP/IP model layers to the OSI model layers.'
        },
        {
            title: 'TCP vs UDP', 
            content: `### Transport Layer: TCP vs UDP\nTCP is connection-oriented...`,
            quiz: [
                { text: 'Which is connectionless?', options: ['TCP', 'UDP', 'HTTP', 'FTP'], ans: 'UDP' },
                { text: 'TCP uses what kind of handshake?', options: ['2-way', '3-way', '4-way', 'No handshake'], ans: '3-way' },
                { text: 'Which protocol is best for Video Streaming?', options: ['TCP', 'UDP', 'SMTP', 'POP3'], ans: 'UDP' },
                { text: 'Which protocol guarantees ordered delivery?', options: ['UDP', 'TCP', 'IP', 'ICMP'], ans: 'TCP' },
                { text: 'What is the size of a TCP header minimum?', options: ['8 bytes', '20 bytes', '32 bytes', '64 bytes'], ans: '20 bytes' }
            ],
            assignment: 'Analyze a Wireshark capture of a TCP 3-way handshake and explain the SYN, SYN-ACK, ACK process.'
        },
        {
            title: 'IP Addressing & Subnetting', 
            content: `### IP Addressing\nIPv4 and Subnetting...`,
            quiz: [
                { text: 'How many bits in an IPv4 address?', options: ['16', '32', '64', '128'], ans: '32' },
                { text: 'How many bits in an IPv6 address?', options: ['32', '64', '128', '256'], ans: '128' },
                { text: 'Which class has subnet mask 255.255.255.0?', options: ['Class A', 'Class B', 'Class C', 'Class D'], ans: 'Class C' },
                { text: 'What does DHCP do?', options: ['Resolves names', 'Assigns IP addresses', 'Routes packets', 'Encrypts data'], ans: 'Assigns IP addresses' },
                { text: 'What is 127.0.0.1?', options: ['Broadcast', 'Loopback', 'Gateway', 'DNS'], ans: 'Loopback' }
            ],
            assignment: 'Calculate the subnet ID, broadcast address, and valid host range for IP 192.168.1.50 /28.'
        },
        {
            title: 'Routing & DNS', 
            content: `### Routing and DNS\nRouting algorithms and Domain Name System...`,
            quiz: [
                { text: 'DNS resolves...', options: ['IP to MAC', 'Domain name to IP', 'IP to Domain name', 'MAC to IP'], ans: 'Domain name to IP' },
                { text: 'Which protocol is used by DNS?', options: ['TCP', 'UDP', 'Both', 'ICMP'], ans: 'Both' },
                { text: 'BGP is an example of...', options: ['Interior Gateway Protocol', 'Exterior Gateway Protocol', 'Distance Vector', 'Link State'], ans: 'Exterior Gateway Protocol' },
                { text: 'OSPF uses which algorithm?', options: ['Dijkstra', 'Bellman Ford', 'Kruskal', 'Prim'], ans: 'Dijkstra' },
                { text: 'What is the default port for DNS?', options: ['80', '443', '53', '22'], ans: '53' }
            ],
            assignment: 'Explain how a recursive DNS query works from the browser to the Root servers.'
        }
    ];

    for (const mod of cnContentMap) {
        const lessons = [];
        lessons.push({ title: `Explanation: ${mod.title}`, type: 'article', duration: 25, content: mod.content });
        const assignmentId = await createSpecificAssignment(`Assignment: ${mod.title}`, mod.assignment, null);
        lessons.push({ title: `Assignment: ${mod.title}`, type: 'assignment', duration: 30, refId: assignmentId });
        const formattedQuestions = mod.quiz.map(q => ({
            questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans], explanation: `Answer is ${q.ans}`
        }));
        const quizId = await createSpecificQuiz(`Quiz: ${mod.title}`, formattedQuestions, null);
        lessons.push({ title: `Quiz: ${mod.title} (5 MCQs)`, type: 'quiz', duration: 10, refId: quizId });
        cnCourse.modules.push({ title: mod.title, lessons });
    }
    const cnFinalQs = [
        { text: 'What port is HTTP?', options: ['80', '443', '21', '25'], ans: '80' },
        { text: 'What protocol resolves IP to MAC?', options: ['DNS', 'ARP', 'DHCP', 'ICMP'], ans: 'ARP' },
        { text: 'Which is a link-state routing protocol?', options: ['RIP', 'BGP', 'OSPF', 'EIGRP'], ans: 'OSPF' },
        { text: 'Ping uses which protocol?', options: ['TCP', 'UDP', 'ICMP', 'IGMP'], ans: 'ICMP' },
        { text: 'What is NAT?', options: ['Network Address Translation', 'Network Area Transmission', 'Node Allocation Table', 'New Arp Tech'], ans: 'Network Address Translation' },
        { text: 'Which layer are Routers on?', options: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'], ans: 'Layer 3' },
        { text: 'Which layer are Switches on?', options: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'], ans: 'Layer 2' },
        { text: 'What is a VPN?', options: ['Virtual Private Network', 'Virtual Public Network', 'VLAN', 'Voice Private Network'], ans: 'Virtual Private Network' },
        { text: 'IPv6 size?', options: ['32 bits', '64 bits', '128 bits', '256 bits'], ans: '128 bits' },
        { text: 'What is CSMA/CD used for?', options: ['Routing', 'Collision Detection in Ethernet', 'Error Correction', 'Encryption'], ans: 'Collision Detection in Ethernet' },
        { text: 'Topology with central hub?', options: ['Ring', 'Star', 'Bus', 'Mesh'], ans: 'Star' },
        { text: 'BGP is...', options: ['Distance Vector', 'Path Vector', 'Link State', 'Hybrid'], ans: 'Path Vector' },
        { text: 'What does TTL prevent?', options: ['Data corruption', 'Infinite routing loops', 'Collisions', 'Packet loss'], ans: 'Infinite routing loops' },
        { text: 'What is an Ephemeral port?', options: ['Port 80', 'Port 443', 'Temporary port assigned by OS', 'Well known port'], ans: 'Temporary port assigned by OS' },
        { text: 'Which is highly secure?', options: ['Telnet', 'FTP', 'HTTP', 'SSH'], ans: 'SSH' }
    ].map(q => ({ questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans] }));

    const cnFinalQuizId = await createSpecificQuiz('CN Final Assessment', cnFinalQs, null);
    cnCourse.finalAssessment = cnFinalQuizId;
    await cnCourse.save();

    // =========================================================================
    // 3. System Design Course
    // =========================================================================
    console.log('Generating System Design Course...');
    const sdCourse = new Course({
        title: 'System Design for Interviews',
        description: 'Learn how to design scalable and distributed systems.',
        category: 'System Design',
        thumbnail: '/courses/sd.png',
        instructor: instructor._id,
        difficulty: 'Hard',
        modules: []
    });
    
    const sdContentMap = [
        {
            title: 'Scalability & Load Balancing', 
            content: `### Scalability...`,
            quiz: [
                { text: 'Scaling out is also known as...', options: ['Vertical Scaling', 'Horizontal Scaling', 'Diagonal Scaling', 'Micro Scaling'], ans: 'Horizontal Scaling' },
                { text: 'Adding more RAM to a single DB server is...', options: ['Horizontal Scaling', 'Vertical Scaling', 'Sharding', 'Caching'], ans: 'Vertical Scaling' },
                { text: 'Which is a common Load Balancing algorithm?', options: ['Round Robin', 'Dijkstra', 'Binary Search', 'KMP'], ans: 'Round Robin' },
                { text: 'What does a Reverse Proxy do?', options: ['Sits in front of web servers and forwards requests', 'Hides client IP from the internet', 'Encrypts DB', 'Caches frontend only'], ans: 'Sits in front of web servers and forwards requests' },
                { text: 'Sticky sessions route a user to...', options: ['A random server', 'The same server they used previously', 'The server with lowest load', 'The closest server geographically'], ans: 'The same server they used previously' }
            ],
            assignment: 'Design a load balancing strategy for a globally distributed API with millions of requests per second.'
        },
        {
            title: 'Caching', 
            content: `### Caching...`,
            quiz: [
                { text: 'Which cache eviction policy discards the oldest accessed item?', options: ['LRU', 'LFU', 'FIFO', 'LIFO'], ans: 'LRU' },
                { text: 'Redis is an example of...', options: ['Relational DB', 'In-memory Key-Value store', 'Message Queue', 'Load Balancer'], ans: 'In-memory Key-Value store' },
                { text: 'What is Cache Thrashing?', options: ['Continuous cache misses leading to high latency', 'Fast cache hits', 'Clearing cache manually', 'Cache warming'], ans: 'Continuous cache misses leading to high latency' },
                { text: 'Which strategy updates cache and DB simultaneously?', options: ['Write-Through', 'Write-Back', 'Write-Around', 'Read-Through'], ans: 'Write-Through' },
                { text: 'A CDN is primarily used to cache...', options: ['Database schemas', 'User passwords', 'Static assets (images, videos)', 'Session tokens'], ans: 'Static assets (images, videos)' }
            ],
            assignment: 'Explain Cache Stampede and how to prevent it using Mutex locks.'
        },
        {
            title: 'Databases & Sharding', 
            content: `### Databases...`,
            quiz: [
                { text: 'ACID stands for...', options: ['Atomicity, Consistency, Isolation, Durability', 'Active, Concurrent, Indexed, Distributed', 'All Consistent In Database', 'Atomicity, Caching, Isolation, Data'], ans: 'Atomicity, Consistency, Isolation, Durability' },
                { text: 'Which is best for highly relational, financial data?', options: ['MongoDB', 'PostgreSQL', 'Cassandra', 'Redis'], ans: 'PostgreSQL' },
                { text: 'Sharding means...', options: ['Vertical partitioning', 'Horizontal partitioning of data across nodes', 'Adding an index', 'Replicating data'], ans: 'Horizontal partitioning of data across nodes' },
                { text: 'What is the CAP Theorem?', options: ['Consistency, Availability, Partition Tolerance', 'Caching, Availability, Performance', 'Concurrency, Atomicity, Partition', 'None'], ans: 'Consistency, Availability, Partition Tolerance' },
                { text: 'Cassandra favors which two in CAP?', options: ['CA', 'AP', 'CP', 'None'], ans: 'AP' }
            ],
            assignment: 'Design a database sharding key for Twitter to efficiently fetch a user\'s timeline.'
        },
        {
            title: 'Microservices & Message Queues', 
            content: `### Microservices...`,
            quiz: [
                { text: 'Microservices communicate primarily via...', options: ['Shared Memory', 'APIs/Network protocols', 'Disk Files', 'Global variables'], ans: 'APIs/Network protocols' },
                { text: 'Kafka is a...', options: ['Relational DB', 'Distributed Event Streaming Platform', 'Load Balancer', 'CDN'], ans: 'Distributed Event Streaming Platform' },
                { text: 'Message queues enable...', options: ['Synchronous communication', 'Asynchronous decoupling', 'UI rendering', 'Database indexing'], ans: 'Asynchronous decoupling' },
                { text: 'What is a Monolith?', options: ['A single large codebase/app', 'A microservice', 'A database', 'A message queue'], ans: 'A single large codebase/app' },
                { text: 'RabbitMQ uses...', options: ['Pub/Sub and Queues', 'SQL queries', 'MapReduce', 'Graph Traversal'], ans: 'Pub/Sub and Queues' }
            ],
            assignment: 'Explain how Event-Driven Architecture helps in processing thousands of orders per second on an e-commerce site.'
        }
    ];

    for (const mod of sdContentMap) {
        const lessons = [];
        lessons.push({ title: `Explanation: ${mod.title}`, type: 'article', duration: 30, content: mod.content });
        const assignmentId = await createSpecificAssignment(`Assignment: ${mod.title}`, mod.assignment, null);
        lessons.push({ title: `Assignment: ${mod.title}`, type: 'assignment', duration: 40, refId: assignmentId });
        const formattedQuestions = mod.quiz.map(q => ({
            questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans], explanation: `Answer is ${q.ans}`
        }));
        const quizId = await createSpecificQuiz(`Quiz: ${mod.title}`, formattedQuestions, null);
        lessons.push({ title: `Quiz: ${mod.title} (5 MCQs)`, type: 'quiz', duration: 10, refId: quizId });
        sdCourse.modules.push({ title: mod.title, lessons });
    }
    
    const sdFinalQs = [
        { text: 'What does a CDN do?', options: ['Caches static assets close to users', 'Runs DB queries', 'Balances load to servers', 'Encrypts data'], ans: 'Caches static assets close to users' },
        { text: 'Which hashing technique minimizes remapping when nodes are added?', options: ['Consistent Hashing', 'MD5', 'SHA-256', 'Linear Hashing'], ans: 'Consistent Hashing' },
        { text: 'What is a Bloom Filter?', options: ['Probabilistic data structure to test membership', 'A cache eviction policy', 'A sorting algorithm', 'A load balancer algorithm'], ans: 'Probabilistic data structure to test membership' },
        { text: 'Long-polling is used for...', options: ['Simulating real-time server push', 'Database backups', 'Caching', 'DNS resolution'], ans: 'Simulating real-time server push' },
        { text: 'WebSockets provide...', options: ['Unidirectional communication', 'Full-duplex bidirectional communication', 'Stateless REST calls', 'Database connections'], ans: 'Full-duplex bidirectional communication' },
        { text: 'Heartbeats are used to...', options: ['Detect node failures', 'Synchronize clocks', 'Transfer files', 'Encrypt data'], ans: 'Detect node failures' },
        { text: 'Rate Limiting prevents...', options: ['SQL Injection', 'DDoS and API abuse', 'Cache misses', 'Database deadlocks'], ans: 'DDoS and API abuse' },
        { text: 'Token bucket algorithm is used for...', options: ['Rate Limiting', 'Hashing', 'Sorting', 'Caching'], ans: 'Rate Limiting' },
        { text: 'What is an API Gateway?', options: ['Single entry point for microservices', 'A database', 'A message queue', 'A CDN'], ans: 'Single entry point for microservices' },
        { text: 'Event Sourcing stores...', options: ['Current state only', 'Sequence of state-changing events', 'User passwords', 'Static images'], ans: 'Sequence of state-changing events' },
        { text: 'CQRS stands for...', options: ['Command Query Responsibility Segregation', 'Cache Query Response System', 'Consistent Query Relational Store', 'None'], ans: 'Command Query Responsibility Segregation' },
        { text: 'What is Gossip Protocol?', options: ['Node communication in distributed systems', 'Chat application', 'Load balancing algo', 'Security protocol'], ans: 'Node communication in distributed systems' },
        { text: 'MongoDB stores data as...', options: ['Tables', 'BSON documents', 'Graphs', 'Key-Value pairs'], ans: 'BSON documents' },
        { text: 'What is active-active replication?', options: ['Both nodes handle reads/writes', 'One node writes, one reads', 'One node is standby', 'No replication'], ans: 'Both nodes handle reads/writes' },
        { text: 'A single point of failure (SPOF) should be...', options: ['Encouraged', 'Avoided/Eliminated', 'Ignored', 'Monitored only'], ans: 'Avoided/Eliminated' }
    ].map(q => ({ questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans] }));

    const sdFinalQuizId = await createSpecificQuiz('System Design Final Assessment', sdFinalQs, null);
    sdCourse.finalAssessment = sdFinalQuizId;
    await sdCourse.save();

    // =========================================================================
    // 4. QALR Course
    // =========================================================================
    console.log('Generating Quantitative Aptitude Course...');
    const quantCourse = new Course({
        title: 'Quantitative Aptitude & Logical Reasoning',
        description: 'Master mathematical concepts and logical reasoning.',
        category: 'Aptitude',
        thumbnail: '/courses/quant.png',
        instructor: instructor._id,
        difficulty: 'Easy',
        modules: []
    });
    
    const quantContentMap = [
        {
            title: 'Percentages & Profit/Loss', 
            content: `### Percentages...`,
            quiz: [
                { text: 'What is 20% of 150?', options: ['20', '30', '40', '50'], ans: '30' },
                { text: 'If CP is 100 and SP is 120, what is Profit %?', options: ['10%', '20%', '25%', '30%'], ans: '20%' },
                { text: 'If a number is increased by 10% then decreased by 10%, the net change is:', options: ['No change', '1% decrease', '1% increase', '10% decrease'], ans: '1% decrease' },
                { text: 'Find fraction equivalent of 12.5%', options: ['1/4', '1/6', '1/8', '1/12'], ans: '1/8' },
                { text: 'If Loss is 20% on CP=500, what is SP?', options: ['400', '420', '450', '600'], ans: '400' }
            ],
            assignment: 'Solve 10 questions on Profit, Loss, and Discount.'
        },
        {
            title: 'Time & Work', 
            content: `### Time and Work...`,
            quiz: [
                { text: 'A does work in 10 days, B in 15 days. Together they do it in?', options: ['5 days', '6 days', '8 days', '12 days'], ans: '6 days' },
                { text: 'If 5 men can do a job in 10 days, 10 men can do it in?', options: ['5 days', '10 days', '20 days', '2 days'], ans: '5 days' },
                { text: 'Efficiency and time are...', options: ['Directly proportional', 'Inversely proportional', 'Equal', 'Unrelated'], ans: 'Inversely proportional' },
                { text: 'A is twice as fast as B. If B takes 12 days, A takes?', options: ['6 days', '24 days', '12 days', '4 days'], ans: '6 days' },
                { text: 'Work Done = Efficiency x ?', options: ['Time', 'Speed', 'Distance', 'Cost'], ans: 'Time' }
            ],
            assignment: 'Solve pipeline and cistern problems applying Time and Work principles.'
        },
        {
            title: 'Time, Speed & Distance', 
            content: `### Time, Speed and Distance\nFundamental formulas...`,
            quiz: [
                { text: 'Speed = 60km/h. Time = 2h. Distance?', options: ['120km', '60km', '30km', '100km'], ans: '120km' },
                { text: 'Convert 18 km/h to m/s.', options: ['5 m/s', '10 m/s', '18 m/s', '54 m/s'], ans: '5 m/s' },
                { text: 'A train 100m long passes a pole in 10s. Speed?', options: ['10 m/s', '20 m/s', '30 m/s', '100 m/s'], ans: '10 m/s' },
                { text: 'Average speed of 40km/h and 60km/h for same distance?', options: ['50 km/h', '48 km/h', '52 km/h', '45 km/h'], ans: '48 km/h' },
                { text: 'Relative speed of two bodies moving in opposite directions is...', options: ['Sum of speeds', 'Difference of speeds', 'Product', 'Zero'], ans: 'Sum of speeds' }
            ],
            assignment: 'Solve relative speed problems involving two trains crossing each other.'
        },
        {
            title: 'Probability & Combinatorics', 
            content: `### Probability & Combinatorics\nPermutations and Combinations...`,
            quiz: [
                { text: 'Probability of rolling a 6 on a fair die?', options: ['1/2', '1/6', '1/3', '1'], ans: '1/6' },
                { text: 'How many permutations of the word CAT?', options: ['3', '6', '9', '1'], ans: '6' },
                { text: 'What is 5 factorial (5!)?', options: ['120', '60', '24', '100'], ans: '120' },
                { text: 'Probability of drawing an Ace from a deck of cards?', options: ['1/13', '1/4', '1/52', '4/13'], ans: '1/13' },
                { text: 'Difference between Permutation and Combination?', options: ['Order matters in Permutation', 'Order matters in Combination', 'They are identical', 'Permutation is for probabilities'], ans: 'Order matters in Permutation' }
            ],
            assignment: 'Calculate the probability of drawing two red balls consecutively without replacement from a bag.'
        },
        {
            title: 'Logical Reasoning: Syllogisms', 
            content: `### Syllogisms\nLogical deductions and Venn diagrams...`,
            quiz: [
                { text: 'If ALL A are B, and ALL B are C, then...', options: ['ALL A are C', 'SOME A are not C', 'NO A is C', 'None'], ans: 'ALL A are C' },
                { text: 'If SOME Cats are Dogs, and NO Dogs are Birds...', options: ['Some Cats are not Birds', 'All Cats are Birds', 'No Cats are Birds', 'None of the above'], ans: 'Some Cats are not Birds' },
                { text: 'Which diagram best solves Syllogisms?', options: ['Venn Diagram', 'Bar Chart', 'Pie Chart', 'Scatter Plot'], ans: 'Venn Diagram' },
                { text: 'If NO A is B, then...', options: ['NO B is A', 'SOME B is A', 'ALL B is A', 'Cannot be determined'], ans: 'NO B is A' },
                { text: 'Premise 1: All men are mortal. Premise 2: Socrates is a man. Conclusion?', options: ['Socrates is mortal', 'Socrates is immortal', 'All mortals are men', 'None'], ans: 'Socrates is mortal' }
            ],
            assignment: 'Draw Venn Diagrams for 5 different complex syllogism statements.'
        },
        {
            title: 'Data Interpretation', 
            content: `### Data Interpretation\nReading charts, graphs, and tables...`,
            quiz: [
                { text: 'Which chart is best for showing percentages of a whole?', options: ['Pie Chart', 'Line Graph', 'Scatter Plot', 'Histogram'], ans: 'Pie Chart' },
                { text: 'A Bar Graph usually represents...', options: ['Categorical data', 'Continuous time', 'Geographic data', 'Proportions only'], ans: 'Categorical data' },
                { text: 'To find the trend over 10 years, which graph is best?', options: ['Line Graph', 'Pie Chart', 'Venn Diagram', 'Table'], ans: 'Line Graph' },
                { text: 'If a pie chart has 360 degrees, what angle represents 25%?', options: ['90 degrees', '45 degrees', '180 degrees', '25 degrees'], ans: '90 degrees' },
                { text: 'What is the first step in solving DI questions?', options: ['Read the axes and labels', 'Guess the answer', 'Look at the questions', 'Skip the chart'], ans: 'Read the axes and labels' }
            ],
            assignment: 'Analyze a provided dataset table and answer 5 questions based on averages and percentages.'
        }
    ];

    for (const mod of quantContentMap) {
        const lessons = [];
        lessons.push({ title: `Explanation: ${mod.title}`, type: 'article', duration: 35, content: mod.content });
        const assignmentId = await createSpecificAssignment(`Assignment: ${mod.title}`, mod.assignment, null);
        lessons.push({ title: `Practice Assignment: ${mod.title}`, type: 'assignment', duration: 40, refId: assignmentId });
        const formattedQuestions = mod.quiz.map(q => ({
            questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans], explanation: `Answer is ${q.ans}`
        }));
        const quizId = await createSpecificQuiz(`Quiz: ${mod.title}`, formattedQuestions, null);
        lessons.push({ title: `Practice Quiz: ${mod.title} (5 MCQs)`, type: 'quiz', duration: 10, refId: quizId });
        quantCourse.modules.push({ title: mod.title, lessons });
    }

    const quantFinalQs = [
        { text: 'Solve: 5 + 5 * 5', options: ['50', '30', '25', '10'], ans: '30' },
        { text: 'Speed = 60km/h. Time = 2h. Distance?', options: ['120km', '60km', '30km', '100km'], ans: '120km' },
        { text: 'Probability of rolling a 6 on a dice?', options: ['1/2', '1/6', '1/3', '1'], ans: '1/6' },
        { text: 'Next number in series: 2, 4, 8, 16...', options: ['24', '32', '64', '20'], ans: '32' },
        { text: 'If ALL A are B, and ALL B are C, then...', options: ['ALL A are C', 'SOME A are not C', 'NO A is C', 'None'], ans: 'ALL A are C' },
        { text: 'A train 100m long passes a pole in 10s. Speed?', options: ['10 m/s', '20 m/s', '30 m/s', '100 m/s'], ans: '10 m/s' },
        { text: '5! (Factorial 5) is?', options: ['120', '60', '24', '100'], ans: '120' },
        { text: 'How many permutations of word CAT?', options: ['3', '6', '9', '1'], ans: '6' },
        { text: 'Simple interest on 1000 at 10% for 2 yrs?', options: ['100', '200', '1200', '210'], ans: '200' },
        { text: 'Average of first 5 natural numbers?', options: ['2', '3', '4', '5'], ans: '3' },
        { text: 'If A:B is 2:3 and B:C is 3:4, A:C is?', options: ['2:4', '1:2', 'Both', '3:2'], ans: '1:2' },
        { text: 'Which is a prime number?', options: ['1', '2', '4', '9'], ans: '2' },
        { text: 'HCF of 12 and 18?', options: ['6', '36', '2', '3'], ans: '6' },
        { text: 'LCM of 4 and 6?', options: ['12', '24', '10', '2'], ans: '12' },
        { text: 'Square root of 144?', options: ['12', '14', '16', '10'], ans: '12' }
    ].map(q => ({ questionText: q.text, type: 'SingleCorrect', options: q.options, correctAnswers: [q.ans] }));

    const quantFinalQuizId = await createSpecificQuiz('QALR Final Test', quantFinalQs, null);
    quantCourse.finalAssessment = quantFinalQuizId;
    await quantCourse.save();

    console.log('✅ Enterprise Rich courses created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedEnterprise();
