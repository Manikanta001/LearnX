const mongoose = require('mongoose');
const { Schema } = mongoose;

const BadgeSchema = new Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  dateEarned: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  isTestUser: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  education: { type: String, default: '' },
  skills: [{ type: String }],
  resumeUrl: { type: String, default: '' },
  
  // Gamification & Progress
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastSolvedDate: { type: String, default: null }, // YYYY-MM-DD format
  solveHistory: {
    type: Map,
    of: Number,
    default: {}
  },
  badges: [BadgeSchema],

  // DSA Practice Trackers
  solvedProblems: [{ type: String }], 
  attemptedProblems: [{ type: String }],
  bookmarks: [{ type: String }],
  recentlySolved: [{ type: String }],

  // Reminders
  reminderEnabled: { type: Boolean, default: false },
  preferenceUpdatedAt: { type: Date, default: null },

  // Block status for admin panel
  isBlocked: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model('User', UserSchema);
