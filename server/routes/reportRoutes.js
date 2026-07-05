const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getProjectDashboardReport,
  exportProjectData,
} = require('../controllers/reportController');

router.use(protect);

router.get('/dashboard', getProjectDashboardReport);
router.get('/export', exportProjectData);

module.exports = router;
