const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { isProjectMember } = require('../middleware/roleMiddleware');
const {
  createTemplate,
  getTemplates,
  deleteTemplate,
} = require('../controllers/taskTemplateController');

// Guard all template routes
router.use(protect);
router.use(isProjectMember);

router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:templateId', deleteTemplate);

module.exports = router;
