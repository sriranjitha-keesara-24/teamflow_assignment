const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'COMMENT_MENTION',
        'RCA_SUBMITTED',
        'REVIEW_OUTCOME',
        'DEADLINE_APPROACHING',
        'PROJECT_INVITE',
        'GENERAL',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ['Task', 'Project', 'RCA', 'Comment'],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
