const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssignmentSubmissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  submissionType: { type: String, enum: ['MCQ', 'Coding', 'FileUpload'], required: true },

  // Answers based on submission type
  mcqAnswers: [{
    questionId: { type: String },
    selectedAnswer: { type: String },
  }],
  codingSubmission: {
    code: { type: String },
    language: { type: String },
    result: { type: String }, // Accepted, Wrong Answer, etc.
    output: { type: String },
  },
  fileUrl: { type: String, default: '' }, // Reference url to PDF or ZIP

  // Grading fields
  score: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  status: { type: String, enum: ['Submitted', 'Graded'], default: 'Submitted' },
  gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  gradedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
