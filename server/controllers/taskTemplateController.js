const TaskTemplate = require('../models/TaskTemplate');
const { ApiError } = require('../middleware/errorMiddleware');

// @desc    Create a new task template
// @route   POST /api/v1/projects/:projectId/templates
// @access  Private (Project members only)
const createTemplate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, title, description, priority, tags, subtasks } = req.body;

    if (!name || !title) {
      throw new ApiError('Template name and task prefilled title are required', 400);
    }

    const template = await TaskTemplate.create({
      name,
      title,
      description,
      priority,
      tags,
      subtasks,
      project: projectId,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all templates for a project
// @route   GET /api/v1/projects/:projectId/templates
// @access  Private (Project members only)
const getTemplates = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const templates = await TaskTemplate.find({ project: projectId })
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task template
// @route   DELETE /api/v1/projects/:projectId/templates/:templateId
// @access  Private (Project members only)
const deleteTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const template = await TaskTemplate.findById(templateId);

    if (!template) {
      throw new ApiError('Template not found', 404);
    }

    // Only owner or Admin, or the creator of the template can delete
    const isCreator = template.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCreator && !isAdmin) {
      throw new ApiError('You do not have permission to delete this template', 403);
    }

    await TaskTemplate.findByIdAndDelete(templateId);
    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  deleteTemplate,
};
