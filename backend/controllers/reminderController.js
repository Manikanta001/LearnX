const User = require('../models/User');
const Problem = require('../models/Problem');
const { sendMultipleReminders, sendReminderEmail } = require('../services/emailService');

// Send daily reminders to users who haven't solved today's problem
const sendDailyReminders = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find daily problem deterministically based on date (same as dailyController)
    const problems = await Problem.find({});
    if (problems.length === 0) {
      return res.status(404).json({ error: 'No problems available to remind' });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const index = dayOfYear % problems.length;
    const dailyProblem = problems[index];

    // Get all users who have reminders enabled
    const users = await User.find({ reminderEnabled: true });

    if (users.length === 0) {
      return res.json({ message: 'No users with reminders enabled', count: 0 });
    }

    const recipients = [];

    // Check each user
    for (const userData of users) {
      const lastSolvedDate = userData.lastSolvedDate;

      // Only send reminder if user hasn't solved anything today
      if (lastSolvedDate !== today) {
        recipients.push({
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          problemTitle: dailyProblem.title,
          problemLink: `${process.env.APP_URL || 'http://localhost:3000'}/problems/${dailyProblem._id}`,
        });
      }
    }

    if (recipients.length === 0) {
      return res.json({ message: 'All users have already solved today\'s problem', count: 0 });
    }

    // Send reminders
    const results = await sendMultipleReminders(recipients);

    res.json({
      message: `Daily reminders sent to ${recipients.length} users`,
      count: recipients.length,
      results,
    });
  } catch (error) {
    console.error('Daily reminder error:', error);
    res.status(500).json({ error: 'Failed to send daily reminders' });
  }
};

// Get user's reminder preference
const getReminderPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      reminderEnabled: user.reminderEnabled || false,
      email: user.email,
    });
  } catch (error) {
    console.error('Get reminder preference error:', error);
    res.status(500).json({ error: 'Failed to get reminder preference' });
  }
};

// Update user's reminder preference
const updateReminderPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminderEnabled } = req.body;

    if (typeof reminderEnabled !== 'boolean') {
      return res.status(400).json({ error: 'reminderEnabled must be a boolean' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.reminderEnabled = reminderEnabled;
    user.preferenceUpdatedAt = new Date();
    await user.save();

    res.json({
      message: reminderEnabled ? 'Daily reminders enabled' : 'Daily reminders disabled',
      reminderEnabled,
    });
  } catch (error) {
    console.error('Update reminder preference error:', error);
    res.status(500).json({ error: 'Failed to update reminder preference' });
  }
};

// Send test reminder email (admin only)
const sendTestReminder = async (req, res) => {
  try {
    const { email, problemTitle } = req.body;

    if (!email || !problemTitle) {
      return res.status(400).json({ error: 'email and problemTitle are required' });
    }

    const result = await sendReminderEmail(
      email,
      email.split('@')[0],
      problemTitle,
      `${process.env.APP_URL || 'http://localhost:3000'}/problems/test`
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send test reminder' });
    }

    res.json({ message: 'Test reminder sent successfully', result });
  } catch (error) {
    console.error('Send test reminder error:', error);
    res.status(500).json({ error: 'Failed to send test reminder' });
  }
};

module.exports = {
  sendDailyReminders,
  getReminderPreference,
  updateReminderPreference,
  sendTestReminder,
};
