const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const RCA = require('../models/RCA');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper to upload to Cloudinary with local fallback
const getUploadUrl = async (file) => {
  if (!cloudinary.config().cloud_name || !cloudinary.config().api_key) {
    return `/uploads/${file.filename}`;
  }
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'teamflow',
    });
    // Remove local file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.error('Failed to unlink local file after Cloudinary upload:', e);
    }
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload fallback to local disk:', err);
    return `/uploads/${file.filename}`;
  }
};

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * @desc    Upload attachment to a task
 * @route   POST /api/v1/tasks/:taskId/attachments
 * @access  Private
 */
const uploadTaskAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'File type not allowed' });
    }
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
    }

    const url = await getUploadUrl(req.file);

    const attachment = await Attachment.create({
      task: task._id,
      uploader: req.user._id,
      filename: req.file.originalname,
      url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      project: task.project,
    });

    await attachment.populate('uploader', 'name avatar');

    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload attachment to an RCA
 * @route   POST /api/v1/rca/:rcaId/attachments
 * @access  Private
 */
const uploadRCAAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const rca = await RCA.findById(req.params.rcaId);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'File type not allowed' });
    }
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
    }

    const url = await getUploadUrl(req.file);

    const attachment = await Attachment.create({
      rca: rca._id,
      uploader: req.user._id,
      filename: req.file.originalname,
      url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      project: rca.project,
    });

    await attachment.populate('uploader', 'name avatar');

    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get attachments for a task
 * @route   GET /api/v1/tasks/:taskId/attachments
 * @access  Private
 */
const getTaskAttachments = async (req, res, next) => {
  try {
    const attachments = await Attachment.find({ task: req.params.taskId })
      .populate('uploader', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, data: attachments });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get attachments for an RCA
 * @route   GET /api/v1/rca/:rcaId/attachments
 * @access  Private
 */
const getRCAAttachments = async (req, res, next) => {
  try {
    const attachments = await Attachment.find({ rca: req.params.rcaId })
      .populate('uploader', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, data: attachments });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete an attachment (uploader or admin)
 * @route   DELETE /api/v1/attachments/:id
 * @access  Private
 */
const deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    if (
      attachment.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete file
    if (attachment.url.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '../../public', attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (attachment.url.includes('cloudinary.com')) {
      const parts = attachment.url.split('/');
      const folderAndName = parts.slice(-2).join('/'); // e.g. "teamflow/filename"
      const publicId = folderAndName.split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Failed to delete from Cloudinary:', err);
      }
    }

    await attachment.deleteOne();
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadTaskAttachment,
  uploadRCAAttachment,
  getTaskAttachments,
  getRCAAttachments,
  deleteAttachment,
  getUploadUrl,
};
