const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const DiscussionSchema = new Schema({
  title: { type: String, default: '' }, // For questions only
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true }, // Cache author name for speed
  type: { type: String, enum: ['Question', 'Answer'], required: true },
  questionRef: { type: Schema.Types.ObjectId, ref: 'Discussion', default: null, index: true }, // Reference for Answers
  tags: [{ type: String }],
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs who upvoted
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs who downvoted
  comments: [CommentSchema],
  acceptedAnswer: { type: Schema.Types.ObjectId, ref: 'Discussion', default: null }, // Link to answer
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Discussion', DiscussionSchema);
