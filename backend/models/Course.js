const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'pdf', 'quiz', 'assignment', 'article'], required: true },
  content: { type: String, default: '' }, // Markdown notes or instructions
  videoUrl: { type: String, default: '' }, // Stream URL
  notesUrl: { type: String, default: '' }, // PDF notes URL
  duration: { type: Number, default: 0 }, // in minutes
  refId: { type: String, default: '' }, // ID reference to Quiz or Assignment
});

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  lessons: [LessonSchema],
});

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  modules: [ModuleSchema],
  finalAssessment: { type: Schema.Types.ObjectId, ref: 'Quiz', default: null },
  rating: { type: Number, default: 4.5 },
  ratingsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', CourseSchema);
