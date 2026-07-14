const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionSchema = new Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ['SingleCorrect', 'MultipleCorrect', 'TrueFalse', 'FillInBlank'],
    required: true,
  },
  options: [{ type: String }], // Optional for FillInBlank
  correctAnswers: [{ type: String }, { index: true }], // Array of correct option strings or exact text answers
  explanation: { type: String, default: '' },
});

const QuizSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  course: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
  duration: { type: Number, default: 15 }, // in minutes
  maxAttempts: { type: Number, default: 3 },
  questions: [QuestionSchema],
  negativeMarking: { type: Boolean, default: false },
  negativeMarkValue: { type: Number, default: 0.25 }, // fractional points deducted
  pointsPerQuestion: { type: Number, default: 10 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quiz', QuizSchema);
