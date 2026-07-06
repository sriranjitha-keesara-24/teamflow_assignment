const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getProjectStats,
  getProjectActivities,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { isProjectMember } = require('../middleware/roleMiddleware');

// All project routes require authentication
router.use(protect);

// Project CRUD
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project stats & activity log
router.get('/:id/stats', getProjectStats);
router.get('/:projectId/activities', isProjectMember, getProjectActivities);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
