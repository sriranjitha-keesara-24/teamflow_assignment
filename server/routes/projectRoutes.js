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
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All project routes require authentication
router.use(protect);

// Project CRUD
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project stats
router.get('/:id/stats', getProjectStats);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
