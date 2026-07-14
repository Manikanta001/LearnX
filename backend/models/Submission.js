const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestCaseResultSchema = new Schema({
  index: { type: Number, required: true },
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  status: { type: String, required: true },
});

const SubmissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  result: { type: String, required: true }, // e.g. Accepted, Wrong Answer, Compilation Error, Runtime Error
  output: { type: String, default: '' },
  testCaseResults: [TestCaseResultSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Submission', SubmissionSchema);
