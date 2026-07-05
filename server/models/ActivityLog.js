const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entity: {
      type: String,
      enum: ['Task', 'Project', 'RCA', 'User'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  { timestamps: true }
);

// Compound index for fetching recent activity by project or entity
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
