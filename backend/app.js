require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./utils/db');

// Connect to MongoDB
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const hintRoutes = require('./routes/hintRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const dailyRoutes = require('./routes/dailyRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

// New EdTech LMS routes
const courseRoutes = require('./routes/courseRoutes');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const forumRoutes = require('./routes/forumRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',').map((item) => item.trim()).filter(Boolean),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error('CORS blocked origin:', origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Serve static PDF files for study materials
app.use('/api/study_materials', express.static(path.join(__dirname, 'study_Materials')));

// Core API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/hint', hintRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reminder', reminderRoutes);

// New LMS API endpoints
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/certificates', certificateRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'mongodb', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;