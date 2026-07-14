const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Course = require('./models/Course');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

const seedRichData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to DB');

    // Find or create an instructor
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
            firebaseUid: 'dummy_firebase_uid_123_rich',
            role: 'admin'
        });
    }

    // Drop old dummy courses
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

    const courses = [
      {
        title: 'Quantitative Aptitude Masterclass',
        description: 'Comprehensive guide to solving aptitude questions for placements and competitive exams. Learn through detailed explanations, quizzes, and practical assignments.',
        category: 'Aptitude',
        instructor: instructor._id,
        difficulty: 'Medium',
        modules: [
            {
                title: 'Numbers and Arithmetic (Easy)',
                description: 'Build a strong foundation in numbers, fractions, and percentages.',
                lessons: [
                    {
                        title: 'Topic Explanation: Number Systems',
                        type: 'pdf',
                        duration: 15,
                        content: `### Number Systems and Divisibility

The foundation of all quantitative aptitude is a strong grasp of how numbers behave. The number system categorizes numbers into various types such as natural numbers, whole numbers, integers, rational, irrational, real, and complex numbers. 

**Prime Numbers:** A prime number is a natural number greater than 1 that has exactly two distinct positive divisors: 1 and itself. For example, 2, 3, 5, 7, 11 are primes. Recognizing primes is crucial for factorization problems. Note that 2 is the only even prime number.

**Co-Primes:** Two numbers are said to be co-prime or relatively prime if their highest common factor (HCF) is 1. For instance, 8 and 15 are co-prime, even though neither is a prime number individually.

**Divisibility Rules:** Knowing these shortcuts can save you immense time during exams:
- **By 2:** The last digit must be even (0, 2, 4, 6, 8).
- **By 3:** The sum of all digits must be divisible by 3. Example: 123 -> 1+2+3 = 6 (Divisible by 3).
- **By 4:** The number formed by the last two digits must be divisible by 4. Example: 716 -> 16 is divisible by 4.
- **By 5:** The last digit must be 0 or 5.
- **By 6:** The number must be divisible by both 2 and 3.
- **By 8:** The number formed by the last three digits must be divisible by 8.
- **By 9:** The sum of all digits must be divisible by 9.
- **By 11:** The difference between the sum of digits in odd places and the sum of digits in even places is either 0 or a multiple of 11.

**Units Digit Concept:**
Finding the units digit of a large power (e.g., 2^100) relies on cyclical patterns. 
The powers of 2 follow a cycle of 4 in their units digit: 2, 4, 8, 6, 2, 4...
Therefore, to find the units digit of 2^100, divide 100 by 4. The remainder is 0, meaning it corresponds to the 4th value in the cycle, which is 6.

**Example Code (Prime Checker):**
\`\`\`javascript
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}
\`\`\`
Take your time to memorize the divisibility rules as they will be your fastest tool for solving simplification questions.
`
                    },
                    {
                        title: 'Quiz: Number Systems',
                        type: 'quiz',
                        duration: 10,
                        content: `### Multiple Choice Questions

**Question 1:** Which of the following is NOT a prime number?
A) 31
B) 61
C) 71
D) 91

**Question 2:** If a number is divisible by both 3 and 4, it must always be divisible by:
A) 7
B) 12
C) 24
D) 9

**Question 3:** What is the units digit of 3^45?
A) 1
B) 3
C) 7
D) 9

*Try to solve these on paper before looking up the answers!*`
                    },
                    {
                        title: 'Assignment: Divisibility Engine',
                        type: 'assignment',
                        duration: 45,
                        content: `### Assignment Task

Write a program in your preferred language that takes a large integer as a string (to prevent integer overflow) and determines if it is divisible by 11 using the alternate sum rule discussed in the explanation.

**Requirements:**
1. Input: A string representing a large positive integer (e.g., "1083928374928374").
2. Logic: Sum the odd-positioned digits. Sum the even-positioned digits. Subtract the two sums. If the result is 0 or divisible by 11, the number is divisible by 11.
3. Output: Boolean (true if divisible, false otherwise).

**Submission:**
Upload your code file (.js, .py, .cpp, or .java).`
                    }
                ]
            }
        ]
      },
      {
        title: 'System Design for Interviews',
        description: 'Master the art of designing scalable, distributed architectures. Includes detailed theory, conceptual quizzes, and architecture design assignments.',
        category: 'System Design',
        instructor: instructor._id,
        difficulty: 'Hard',
        modules: [
            {
                title: 'Scaling and Data (Medium)',
                description: 'Learn how to handle massive traffic using load balancers and caches.',
                lessons: [
                    {
                        title: 'Topic Explanation: Load Balancing & Caching',
                        type: 'pdf',
                        duration: 25,
                        content: `### Load Balancing and Caching Strategies

When a web application becomes popular, a single server can no longer handle the traffic. This is where horizontal scaling and load balancers come in.

**Horizontal Scaling:** Instead of buying a bigger server (Vertical Scaling), we add more servers to the pool. This provides redundancy and infinite scalability. However, we now need a way to distribute incoming traffic evenly across these servers.

**Load Balancers:** A Load Balancer sits between the client and the servers. It routes incoming requests using algorithms like:
- **Round Robin:** Requests are distributed sequentially.
- **Least Connections:** Requests are sent to the server with the fewest active connections.
- **IP Hash:** The client's IP address determines which server receives the request, useful for maintaining sticky sessions.

**Caching:** 
Even with multiple servers, querying the database for every request is a massive bottleneck. Caching stores copies of frequently accessed data in extremely fast, in-memory storage systems like Redis or Memcached.

**Types of Caching:**
1. **Application Caching:** The server checks the cache before hitting the DB.
2. **Database Caching:** The DB itself caches frequent queries.
3. **CDN (Content Delivery Network):** Static assets (images, CSS) are cached geographically close to the user.

**Cache Invalidation Strategies:**
Keeping the cache in sync with the database is the hardest part of caching.
- **Write-through cache:** Data is written to the cache and the DB simultaneously. Slow writes, fast reads.
- **Write-around cache:** Data is written to the DB, bypassing the cache. Reduces cache churn.
- **Write-back cache:** Data is written to the cache alone, and synced to the DB asynchronously later. Risk of data loss if the cache crashes.

**Example Code (Redis Cache with Node.js):**
\`\`\`javascript
app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    
    // Check Redis cache first
    const cachedUser = await redisClient.get(\`user:\${id}\`);
    if (cachedUser) {
        return res.json(JSON.parse(cachedUser));
    }
    
    // Cache Miss: Query Database
    const user = await Database.query('SELECT * FROM users WHERE id = ?', [id]);
    
    // Store in cache for 1 hour
    await redisClient.setEx(\`user:\${id}\`, 3600, JSON.stringify(user));
    
    res.json(user);
});
\`\`\`
`
                    },
                    {
                        title: 'Quiz: Scaling Architectures',
                        type: 'quiz',
                        duration: 10,
                        content: `### Multiple Choice Questions

**Question 1:** Which load balancing algorithm is best for ensuring that a user always connects to the same backend server (sticky session)?
A) Round Robin
B) Least Connections
C) IP Hashing
D) Random

**Question 2:** In a Write-Through caching strategy:
A) Data is written only to the database, and the cache is updated later.
B) Data is written only to the cache, and the database is updated asynchronously.
C) Data is written to both the cache and the database simultaneously.
D) Data is never written to the cache.

**Question 3:** Which of the following is best suited for a Content Delivery Network (CDN)?
A) User session data
B) Real-time financial transaction records
C) Static images and video files
D) Encrypted password hashes`
                    },
                    {
                        title: 'Assignment: Design a URL Shortener',
                        type: 'assignment',
                        duration: 60,
                        content: `### Assignment Task

Design a highly available and scalable URL shortening service like TinyURL.

**Requirements:**
1. Provide a High-Level Architecture Diagram (you can use text, plantUML, or an uploaded image).
2. Explain how you will generate the unique short URL (e.g., Base62 encoding, MD5 hashing, or a counter service).
3. Where will you place the Load Balancers?
4. How will you use Caching to speed up the redirection process?

**Submission:**
Submit a markdown file (.md) or a PDF containing your architecture breakdown and explanations.`
                    }
                ]
            }
        ]
      },
      {
        title: 'Operating Systems Essentials',
        description: 'Deep dive into OS concepts including process management, threading, and concurrency. Learn through theory, conceptual questions, and code assignments.',
        category: 'Operating System',
        instructor: instructor._id,
        difficulty: 'Medium',
        modules: [
            {
                title: 'Concurrency and Synchronization (Medium)',
                description: 'How OS manages memory and handles race conditions.',
                lessons: [
                    {
                        title: 'Topic Explanation: Mutexes and Deadlocks',
                        type: 'pdf',
                        duration: 20,
                        content: `### Concurrency Control and Race Conditions

Modern operating systems execute multiple processes and threads simultaneously. When multiple threads access and modify a shared resource (like a variable in memory) at the exact same time, it creates a **Race Condition**. The final value depends on the unpredictable timing of thread execution, leading to bugs that are notoriously hard to reproduce.

**The Critical Section:**
The part of the code where the shared resource is accessed is called the critical section. To prevent race conditions, we must ensure **Mutual Exclusion**—only one thread can be in the critical section at a time.

**Mutexes (Mutual Exclusion Locks):**
A Mutex is a synchronization primitive. Before a thread enters the critical section, it must "acquire" the mutex lock. If another thread already holds the lock, the new thread goes to sleep (blocks) until the lock is released.

**Example of Fixing Race Condition (Pseudocode):**
\`\`\`cpp
int account_balance = 1000;
std::mutex mtx;

void withdraw(int amount) {
    mtx.lock();       // Acquire lock
    
    // Critical Section
    if (account_balance >= amount) {
        account_balance -= amount;
    }
    
    mtx.unlock();     // Release lock
}
\`\`\`

**Deadlocks:**
While mutexes fix race conditions, they introduce a new problem: Deadlocks. A deadlock occurs when Thread A holds Lock 1 and waits for Lock 2, while Thread B holds Lock 2 and waits for Lock 1. Both threads are blocked forever.

**Coffman Conditions for Deadlock:**
A deadlock only happens if all four conditions hold true simultaneously:
1. **Mutual Exclusion:** Resources cannot be shared.
2. **Hold and Wait:** A process holds a resource while waiting for another.
3. **No Preemption:** Resources cannot be forcibly taken away.
4. **Circular Wait:** A circular chain of processes exists, each waiting for a resource held by the next.

To prevent deadlocks, operating systems try to break at least one of these four conditions, often by enforcing a strict ordering on how locks are acquired.
`
                    },
                    {
                        title: 'Quiz: Concurrency',
                        type: 'quiz',
                        duration: 10,
                        content: `### Multiple Choice Questions

**Question 1:** The section of code that accesses shared memory and must be executed atomically is called:
A) The Blocked Section
B) The Safe Zone
C) The Critical Section
D) The Executable Area

**Question 2:** Which of the following is NOT one of the four necessary conditions for a deadlock?
A) Mutual Exclusion
B) Hold and Wait
C) Multithreading
D) Circular Wait

**Question 3:** What happens if a thread tries to acquire a mutex that is already locked by another thread?
A) The thread crashes with a segmentation fault.
B) The thread preempts the other thread and steals the lock.
C) The thread blocks (sleeps) until the lock is released.
D) The thread skips the critical section and continues execution.`
                    },
                    {
                        title: 'Assignment: Implement a Thread-Safe Bank Account',
                        type: 'assignment',
                        duration: 45,
                        content: `### Assignment Task

Write a program simulating a thread-safe Bank Account using Mutexes/Locks.

**Requirements:**
1. Create a BankAccount class with a balance.
2. Implement two methods: \`deposit(amount)\` and \`withdraw(amount)\`.
3. Spawn 10 concurrent threads that randomly deposit and withdraw money from the same account.
4. Use a Mutex (or Lock in Python/Java) inside the methods to ensure the balance never becomes corrupt due to race conditions.

**Submission:**
Upload your source code file demonstrating the thread-safe operations.`
                    }
                ]
            }
        ]
      },
      {
        title: 'Computer Networks Fundamentals',
        description: 'Understand the OSI model, TCP/IP, routing, and networking protocols from the ground up through reading modules, quizzes, and network programming assignments.',
        category: 'Computer Network',
        instructor: instructor._id,
        difficulty: 'Medium',
        modules: [
            {
                title: 'Networking Basics (Easy)',
                description: 'The foundation of the internet and how computers talk to each other.',
                lessons: [
                    {
                        title: 'Topic Explanation: The OSI Model & TCP vs UDP',
                        type: 'pdf',
                        duration: 25,
                        content: `### The OSI Reference Model

The Open Systems Interconnection (OSI) model is a conceptual framework that standardizes the functions of a communication system into seven distinct categories, or layers.

**The 7 Layers (Top to Bottom):**
7. **Application Layer:** Network applications (Web browsers, Email clients). Protocols: HTTP, FTP, SMTP.
6. **Presentation Layer:** Data translation, encryption, and compression.
5. **Session Layer:** Establishing, managing, and terminating connections between local and remote applications.
4. **Transport Layer:** Reliable or unreliable data transfer. Protocols: TCP, UDP.
3. **Network Layer:** Routing packets across multiple networks. Uses IP Addresses. Devices: Routers.
2. **Data Link Layer:** Node-to-node data transfer on the same network. Uses MAC Addresses. Devices: Switches.
1. **Physical Layer:** The physical connection (cables, radio waves, electrical signals).

### Transport Layer: TCP vs. UDP

The transport layer is primarily dominated by two protocols: Transmission Control Protocol (TCP) and User Datagram Protocol (UDP).

**TCP (Transmission Control Protocol):**
- **Connection-Oriented:** Establishes a connection (3-way handshake) before sending data.
- **Reliable:** Guarantees delivery. If packets are lost, they are retransmitted.
- **Ordered:** Packets are reassembled in the correct order using sequence numbers.
- **Use Cases:** Web browsing (HTTP/HTTPS), Email, File transfers—anywhere data integrity is more important than speed.

**UDP (User Datagram Protocol):**
- **Connectionless:** Just fires packets at the destination without checking if it's ready.
- **Unreliable:** No guarantee of delivery. No retransmission of lost packets.
- **Fast:** Much lower latency because there is no overhead of handshakes or error checking.
- **Use Cases:** Live video streaming, VoIP phone calls, multiplayer online gaming—anywhere speed is prioritized and occasional data loss is acceptable.
`
                    },
                    {
                        title: 'Quiz: Networking Foundations',
                        type: 'quiz',
                        duration: 10,
                        content: `### Multiple Choice Questions

**Question 1:** Which layer of the OSI model is responsible for routing packets between different networks using IP addresses?
A) Data Link Layer
B) Network Layer
C) Transport Layer
D) Session Layer

**Question 2:** You are building a live multiplayer First-Person Shooter game. Which protocol should you use for sending player coordinates to the server?
A) TCP
B) UDP
C) HTTP
D) FTP

**Question 3:** What is the primary purpose of the 3-way handshake in networking?
A) To encrypt the data being sent.
B) To resolve a domain name to an IP address.
C) To establish a reliable TCP connection before data transfer begins.
D) To find the MAC address of a destination IP.`
                    },
                    {
                        title: 'Assignment: Build a Simple TCP Chat Server',
                        type: 'assignment',
                        duration: 60,
                        content: `### Assignment Task

Write a basic TCP Server and TCP Client using raw sockets in any programming language (Node.js 'net' module, Python 'socket' module, C, or Java).

**Requirements:**
1. The Server should listen on a specific port (e.g., 8080).
2. The Client should connect to the server and send a text message.
3. The Server should receive the message, prepend "Echo: ", and send it back to the client.
4. The Client should print the echoed response and close the connection.

**Submission:**
Upload the code files for both the server and the client.`
                    }
                ]
            }
        ]
      }
    ];

    for (const course of courses) {
        await Course.create(course);
        console.log(`Created rich course: ${course.title}`);
    }

    console.log('Seeding rich courses completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedRichData();
