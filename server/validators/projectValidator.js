const { body } = require("express-validator");

const createProjectValidator = [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").optional().isLength({ max: 1000 }),
    body("status")
        .optional()
        .isIn(["Active", "On Hold", "Completed", "Archived"])
        .withMessage("Invalid status"),
    body("visibility")
        .optional()
        .isIn(["private", "team"])
        .withMessage("Invalid visibility"),
    body("priority")
        .optional()
        .isIn(["Low", "Medium", "High", "Critical"])
        .withMessage("Invalid priority"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
];

const updateProjectValidator = [
    body("name").optional().trim().notEmpty().withMessage("Project name cannot be empty"),
    body("description").optional().isLength({ max: 1000 }),
    body("status")
        .optional()
        .isIn(["Active", "On Hold", "Completed", "Archived"])
        .withMessage("Invalid status"),
    body("visibility")
        .optional()
        .isIn(["private", "team"])
        .withMessage("Invalid visibility"),
    body("priority")
        .optional()
        .isIn(["Low", "Medium", "High", "Critical"])
        .withMessage("Invalid priority"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Invalid date"),
];

const addMemberValidator = [
    body("userId").notEmpty().withMessage("userId is required"),
    body("role")
        .optional()
        .isIn(["Manager", "Developer"])
        .withMessage("Role must be Manager or Developer"),
];

module.exports = {
    createProjectValidator,
    updateProjectValidator,
    addMemberValidator,
};