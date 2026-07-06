const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getProjectDashboardReport,
  exportProjectData,
  getAdvancedProjectReport,
} = require('../controllers/reportController');

router.use(protect);

router.get('/dashboard', getProjectDashboardReport);
router.get('/export', exportProjectData);
router.get('/advanced', getAdvancedProjectReport);

module.exports = router;
