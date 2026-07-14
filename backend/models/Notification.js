const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['Info', 'QuizReminder', 'AssignmentReminder', 'Certificate', 'Contest', 'System'],
    default: 'Info',
  },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);
