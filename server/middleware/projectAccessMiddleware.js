const Project = require("../models/Project");

// Loads the project and attaches it to req.project. 404s if not found.
const loadProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }
        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
};

// Must be a member (or owner, or global Admin) to view the project
const requireProjectAccess = (req, res, next) => {
    const project = req.project;
    const isAdmin = req.user.role === "Admin";

    if (!isAdmin && !project.isMember(req.user._id)) {
        return res.status(403).json({
            success: false,
            message: "You don't have access to this project",
        });
    }
    next();
};

// Only the project owner, a project Manager, or a global Admin can manage the project
const requireProjectManage = (req, res, next) => {
    const project = req.project;
    const isAdmin = req.user.role === "Admin";
    const memberRole = project.getMemberRole(req.user._id);

    if (!isAdmin && memberRole !== "Owner" && memberRole !== "Manager") {
        return res.status(403).json({
            success: false,
            message: "Only the project owner, a manager, or an admin can do this",
        });
    }
    next();
};

module.exports = { loadProject, requireProjectAccess, requireProjectManage };