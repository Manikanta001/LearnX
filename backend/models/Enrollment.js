const mongoose = require('mongoose');
const { Schema } = mongoose;

const EnrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  progress: { type: Number, default: 0 }, // 0 to 100 percentage
  completedLessons: [{ type: String }], // Array of Lesson IDs
  quizScores: {
    type: Map,
    of: Number,
    default: {}
  },
  completed: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

// Avoid duplicate enrollments
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
