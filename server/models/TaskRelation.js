const mongoose = require('mongoose');

/**
 * TaskRelation represents a dependency between two tasks.
 * predecessor must be completed before successor can change status.
 */
const taskRelationSchema = new mongoose.Schema(
  {
    predecessor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    successor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    type: {
      type: String,
      enum: ['blocks'],
      default: 'blocks',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate dependencies
taskRelationSchema.index(
  { predecessor: 1, successor: 1 },
  { unique: true }
);
taskRelationSchema.index({ project: 1 });
taskRelationSchema.index({ successor: 1 });

module.exports = mongoose.model('TaskRelation', taskRelationSchema);
