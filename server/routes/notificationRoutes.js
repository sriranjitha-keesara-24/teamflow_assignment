const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');

router.use(protect);

router.route('/').get(getNotifications).delete(clearAll);
router.put('/read-all', markAllRead);
router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(deleteNotification);

module.exports = router;
