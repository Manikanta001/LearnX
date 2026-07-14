const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubmittedAnswerSchema = new Schema({
  questionId: { type: String, required: true },
  selectedAnswers: [{ type: String }], // Array for multi-select, single element for single/TF, fill in the blank
});

const QuizSubmissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  answersSubmitted: [SubmittedAnswerSchema],
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  passed: { type: Boolean, default: false },
  attemptNumber: { type: Number, default: 1 },
  timeTaken: { type: Number, default: 0 }, // in seconds
  completedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuizSubmission', QuizSubmissionSchema);
