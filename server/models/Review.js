const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    rca: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RCA',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Needs Revision'],
      required: true,
    },
    comments: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ rca: 1 });
reviewSchema.index({ reviewer: 1 });

module.exports = mongoose.model('Review', reviewSchema);
