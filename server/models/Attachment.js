const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    rca: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RCA',
      default: null,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  { timestamps: true }
);

attachmentSchema.index({ task: 1 });
attachmentSchema.index({ rca: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
