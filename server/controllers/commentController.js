const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get comments for a task
 * @route   GET /api/v1/tasks/:taskId/comments
 * @access  Private
 */
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name avatar email')
      .populate('mentions', 'name avatar email')
      .sort('-createdAt');

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a comment (with @mention parsing)
 * @route   POST /api/v1/tasks/:taskId/comments
 * @access  Private
 */
const createComment = async (req, res, next) => {
  try {
    const { content, mentions } = req.body;

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: req.params.taskId,
      author: req.user._id,
      content,
      mentions: mentions || [],
    });

    await comment.populate('author', 'name avatar email');
    await comment.populate('mentions', 'name avatar email');

    // Activity log
    await ActivityLog.create({
      action: 'COMMENT_ADDED',
      entity: 'Task',
      entityId: task._id,
      user: req.user._id,
      details: `Commented on task "${task.title}"`,
      project: task.project,
    });

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      const authorName = comment.author.name || 'Someone';
      const notificationPromises = mentions.map((userId) =>
        createNotification({
          recipient: userId,
          type: 'COMMENT_MENTION',
          title: 'Mentioned in comment',
          message: `${authorName} mentioned you in a comment on task "${task.title}"`,
          link: `/projects/${task.project}/tasks/${task._id}`, // Task detail route/modal trigger context
          relatedEntity: { type: 'Task', id: task._id },
        })
      );
      Promise.all(notificationPromises).catch((err) => {
        console.error('Error sending mention notifications:', err);
      });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a comment (own only)
 * @route   PUT /api/v1/tasks/:taskId/comments/:commentId
 * @access  Private
 */
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own comments' });
    }

    comment.content = req.body.content || comment.content;
    comment.mentions = req.body.mentions || comment.mentions;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'name avatar email');
    await comment.populate('mentions', 'name avatar email');

    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a comment (own or admin)
 * @route   DELETE /api/v1/tasks/:taskId/comments/:commentId
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };
