const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
    reorderTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addDependency,
    removeDependency,
    getDependencyGraph,
    getMyTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
// const { validate } = require('../middleware/validateRequest');
const { createTaskSchema, updateTaskSchema, reorderTasksSchema, addDependencySchema } = require('../validators/taskValidators');
const { validate } = require('../middleware/validateRequest');


// All task routes require authentication
router.use(protect);

// My tasks (cross-project)
router.get('/my-tasks', getMyTasks);

// Task CRUD
router.post('/', validate(createTaskSchema), createTask);
router.get('/project/:projectId', getTasks);
router.route('/:id').get(getTaskById).put(validate(updateTaskSchema), updateTask).delete(deleteTask);

// Status update
router.patch('/:id/status', updateTaskStatus);

// Reorder (Kanban drag-and-drop)
router.put('/project/:projectId/reorder', validate(reorderTasksSchema), reorderTasks);

// Subtasks
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId/toggle', toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

// Dependencies
router.post('/project/:projectId/dependencies', validate(addDependencySchema), addDependency);
router.delete('/project/:projectId/dependencies/:relationId', removeDependency);
router.get('/project/:projectId/dependencies', getDependencyGraph);

module.exports = router;
