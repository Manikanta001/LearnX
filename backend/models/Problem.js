const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExampleSchema = new Schema({
  input: { type: String, default: '' },
  output: { type: String, default: '' },
  explanation: { type: String, default: '' },
});

const TestCaseSchema = new Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, default: '' },
});

const ProblemSchema = new Schema({
  title: { type: String, required: true, unique: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic: { type: String, required: true },
  source: { type: String, default: 'custom' },
  sourceUrl: { type: String, default: '' },
  description: { type: String, required: true },
  examples: [ExampleSchema],
  constraints: [{ type: String }],
  hints: [{ type: String }],
  testCases: [TestCaseSchema],
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' },
  },
  executionWrapper: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' },
  },
  solution: { type: String, default: '' },
  editorial: { type: String, default: '' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: 'admin' },
});

module.exports = mongoose.model('Problem', ProblemSchema);
