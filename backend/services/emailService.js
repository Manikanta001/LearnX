const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // Using Gmail - requires App Password
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Using custom SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  console.warn('Email service not configured - using demo mode');
  return null;
};

const transporter = createTransporter();

const sendReminderEmail = async (userEmail, userName, problemTitle, problemLink) => {
  if (!transporter) {
    console.warn(`[DEMO] Would send reminder email to ${userEmail}`);
    return { success: true, demo: true };
  }

  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hey ${userName}! 👋</h2>
        <p style="font-size: 16px; color: #666;">
          You haven't solved today's problem yet!
        </p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">Today's Challenge</h3>
          <p style="font-size: 18px; font-weight: bold; color: #333;">${problemTitle}</p>
          <p style="color: #666; margin: 10px 0;">Keep your streak alive! Every problem solved brings you closer to mastery.</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${problemLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Solve Now
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Got no time right now? No worries! You'll get another reminder tomorrow.<br>
          <a href="${process.env.APP_URL || 'https://dsa-platform.vercel.app'}" style="color: #2563eb; text-decoration: none;">Continue on DSA Platform</a>
        </p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: `DSA Platform <${process.env.EMAIL_USER || 'noreply@dsa-platform.com'}>`,
      to: userEmail,
      subject: `📌 Reminder: Solve "${problemTitle}" - Don't Miss Your Streak!`,
      html: htmlContent,
    });

    console.log(`Reminder email sent to ${userEmail}`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
};

const sendMultipleReminders = async (recipients) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendReminderEmail(
      recipient.email,
      recipient.name,
      recipient.problemTitle,
      recipient.problemLink
    );
    results.push({ email: recipient.email, ...result });
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
};

module.exports = {
  sendReminderEmail,
  sendMultipleReminders,
  transporter,
};
