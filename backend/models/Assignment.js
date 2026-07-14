const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssignmentMCQQuestionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }, // Index or string of the option
});

const AssignmentSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  course: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
  type: { type: String, enum: ['MCQ', 'Coding', 'FileUpload'], required: true },
  maxMarks: { type: Number, default: 100 },
  deadline: { type: Date, required: true },
  instructions: { type: String, default: '' },

  // Fields for specific assignment types
  codingProblem: { type: Schema.Types.ObjectId, ref: 'Problem', default: null }, // Link to a Problem doc
  mcqQuestions: [AssignmentMCQQuestionSchema], // For MCQ Type
  fileRequirements: { type: String, default: 'PDF or ZIP format, max 10MB' }, // For FileUpload Type

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
