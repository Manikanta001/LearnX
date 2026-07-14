const User = require('../models/User');
const Problem = require('../models/Problem');
const { sendMultipleReminders } = require('../services/emailService');

const REMINDER_HOUR = parseInt(process.env.REMINDER_HOUR || '9');
const REMINDER_MINUTE = parseInt(process.env.REMINDER_MINUTE || '0');

let schedulerActive = false;

const sendDailyRemindersScheduled = async () => {
  try {
    console.log('[Scheduler] Starting daily reminder job...');

    const today = new Date().toISOString().split('T')[0];

    // Find daily problem deterministically based on date (same as dailyController)
    const problems = await Problem.find({});
    if (problems.length === 0) {
      console.log('[Scheduler] No problems available for reminders');
      return;
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const index = dayOfYear % problems.length;
    const dailyProblem = problems[index];

    // Get all users who have reminders enabled
    const users = await User.find({ reminderEnabled: true });

    if (users.length === 0) {
      console.log('[Scheduler] No users with reminders enabled');
      return;
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

    if (recipients.length > 0) {
      const results = await sendMultipleReminders(recipients);
      console.log(`[Scheduler] Sent reminders to ${recipients.length} users`);
      return results;
    } else {
      console.log('[Scheduler] All users have solved today\'s problem');
    }
  } catch (error) {
    console.error('[Scheduler] Error sending daily reminders:', error);
  }
};

const initializeScheduler = () => {
  if (schedulerActive) {
    console.log('[Scheduler] Already initialized');
    return;
  }

  // Check email configuration
  if (!process.env.EMAIL_USER && !process.env.SMTP_HOST) {
    console.warn('[Scheduler] Email service not configured - reminders disabled');
    console.warn('[Scheduler] Set EMAIL_USER/EMAIL_PASSWORD or SMTP_HOST to enable email reminders');
    return;
  }

  schedulerActive = true;
  console.log(`[Scheduler] Initialized - reminders scheduled for ${REMINDER_HOUR}:${String(REMINDER_MINUTE).padStart(2, '0')} UTC daily`);

  // Run every minute, check if it's the reminder time
  const interval = setInterval(() => {
    const now = new Date();
    if (now.getUTCHours() === REMINDER_HOUR && now.getUTCMinutes() === REMINDER_MINUTE) {
      sendDailyRemindersScheduled();
    }
  }, 60000); // Check every minute

  return {
    stop: () => {
      clearInterval(interval);
      schedulerActive = false;
      console.log('[Scheduler] Stopped');
    },
    sendNow: sendDailyRemindersScheduled,
  };
};

module.exports = {
  initializeScheduler,
  sendDailyRemindersScheduled,
};
