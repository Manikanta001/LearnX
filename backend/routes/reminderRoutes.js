const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  sendDailyReminders,
  getReminderPreference,
  updateReminderPreference,
  sendTestReminder,
} = require('../controllers/reminderController');

// System triggered
router.post('/send-daily', sendDailyReminders);

// User preferences
router.get('/preference', authenticate, getReminderPreference);
router.post('/preference', authenticate, updateReminderPreference);

// Admin / manual test trigger
router.post('/send-test', sendTestReminder);

module.exports = router;
