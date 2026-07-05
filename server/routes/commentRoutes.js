const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

// All routes require authentication
router.use(protect);

router.route('/').get(getComments).post(createComment);
router.route('/:commentId').put(updateComment).delete(deleteComment);

module.exports = router;
