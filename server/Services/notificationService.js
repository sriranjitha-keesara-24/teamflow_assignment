const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendToUser } = require('../sockets/notificationSocket');
const { sendEmail } = require('../utils/sendEmail');
const { logger } = require('../utils/logger');

const TYPE_PREF_MAP = {
  TASK_ASSIGNED: 'taskAssigned',
  TASK_STATUS_CHANGED: 'taskStatusChanged',
  COMMENT_MENTION: 'commentMention',
  RCA_SUBMITTED: 'rcaSubmitted',
  REVIEW_OUTCOME: 'reviewOutcome',
  DEADLINE_APPROACHING: 'deadlineApproaching',
};

/**
 * Creates and delivers a notification via DB, Socket.io, and optionally email
 * @param {Object} payload 
 * @param {String} payload.recipient - User ID
 * @param {String} payload.type - Notification type
 * @param {String} payload.title - Notification title
 * @param {String} payload.message - Notification message
 * @param {String} [payload.link] - Action link (UI route)
 * @param {Object} [payload.relatedEntity] - { type: 'Task'|'Project'|'RCA', id: String }
 */
const createNotification = async ({ recipient, type, title, message, link = null, relatedEntity = null }) => {
  try {
    // 1. Save to database
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      link,
      relatedEntity,
    });

    // 2. Send Real-time socket event
    sendToUser(recipient, 'newNotification', notification);

    // 3. Fetch recipient preferences & email
    const user = await User.findById(recipient).select('email notificationPreferences name');
    if (!user) return notification;

    const prefKey = TYPE_PREF_MAP[type];
    const emailEnabled = prefKey ? user.notificationPreferences[prefKey] : false;

    if (emailEnabled && user.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">TeamFlow Notification</h2>
          <p>Hello ${user.name},</p>
          <p><strong>${title}</strong></p>
          <p>${message}</p>
          ${link ? `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${link}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">View details</a></p>` : ''}
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">You are receiving this email because of your notification settings. You can update your preferences in your TeamFlow profile.</p>
        </div>
      `;

      // Async send in background
      sendEmail({
        to: user.email,
        subject: `TeamFlow: ${title}`,
        html: emailHtml,
      }).catch((err) => {
        logger.error(`Error sending notification email to ${user.email}: ${err.message}`);
      });
    }

    return notification;
  } catch (err) {
    logger.error(`Error creating notification: ${err.message}`);
    throw err;
  }
};

module.exports = {
  createNotification,
};
