const mongoose = require('mongoose');

const rcaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'RCA title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    submitter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    incidentDescription: {
      type: String,
      required: [true, 'Incident description is required'],
      maxlength: 10000,
    },
    impact: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    rootCause: {
      type: String,
      maxlength: 10000,
      default: '',
    },
    resolutionSteps: {
      type: String,
      maxlength: 10000,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Under Review',
        'Approved',
        'Rejected',
        'Needs Revision',
      ],
      default: 'Draft',
    },
    reviewComments: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

rcaSchema.index({ project: 1, status: 1 });
rcaSchema.index({ submitter: 1 });
rcaSchema.index({ reviewer: 1 });

module.exports = mongoose.model('RCA', rcaSchema);
