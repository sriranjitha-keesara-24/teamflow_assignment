// Usage: authorizeRoles("Admin", "Manager")
const Project = require('../models/Project');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this resource`,
      });
    }

    next();
  };
};

/**
 * Global system-role guard, e.g. router.get('/admin', requireRole('Admin'))
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }
  next();
};

/**
 * Confirms the logged-in user belongs to the project in the URL
 * (:projectId param). Attaches `req.project` so downstream handlers don't
 * need to refetch it.
 */
exports.isProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.isMember(req.user._id);
    const isSystemAdmin = req.user.role === 'Admin';

    if (!isOwner && !isMember && !isSystemAdmin) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Project-scoped role guard, e.g. requireProjectRole('Owner', 'Manager')
 * Must run after isProjectMember (relies on req.project).
 */
exports.requireProjectRole = (...roles) => (req, res, next) => {
  const project = req.project;
  const isOwner = project.owner.toString() === req.user._id.toString();
  const member = project.getMember(req.user._id);

  if (isOwner || (member && roles.includes(member.role))) return next();
  return res.status(403).json({ message: 'Insufficient project role for this action.' });
};

module.exports = {
  authorizeRoles,
  requireRole: exports.requireRole,
  isProjectMember: exports.isProjectMember,
  requireProjectRole: exports.requireProjectRole,
};
