const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const taskDependencyService = require('../services/taskDependencyService');
const { ApiError } = require('../middleware/errorMiddleware');
const { createNotification } = require('../Services/notificationService');

// ─── Helper: verify user has access to the project ───────────────
const assertAccess = async (projectId, userId, role) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError('Project not found', 404);

  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(
    (m) => m.user.toString() === userId.toString()
  );

  if (!isOwner && !isMember && role !== 'Admin') {
    throw new ApiError('You are not a member of this project', 403);
  }

  return project;
};

// ─── CREATE TASK ─────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { project: projectId, title, description, assignees, status, priority, dueDate, tags, subtasks } = req.body;

    await assertAccess(projectId, req.user._id, req.user.role);

    const task = await Task.create({
      title,
      description,
      project: projectId,
      creator: req.user._id,
      assignees: assignees || [],
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate,
      tags: tags || [],
      subtasks: subtasks || [],
    });

    await ActivityLog.create({
      action: 'Created task',
      entity: 'Task',
      entityId: task._id,
      user: req.user._id,
      project: projectId,
      details: { title: task.title },
    });

    const populated = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('project', 'name');

    // Notify assignees
    if (assignees && assignees.length > 0) {
      const creatorName = populated.creator?.name || 'Someone';
      const notificationPromises = assignees.map((userId) =>
        createNotification({
          recipient: userId,
          type: 'TASK_ASSIGNED',
          title: 'Assigned to a task',
          message: `${creatorName} assigned you to the task "${task.title}"`,
          link: `/projects/${projectId}`, // UI route for project details page
          relatedEntity: { type: 'Task', id: task._id },
        })
      );
      Promise.all(notificationPromises).catch((err) => {
        console.error('Error sending task assignment notifications:', err);
      });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ─── GET TASKS (for a project, with filters) ─────────────────────
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await assertAccess(projectId, req.user._id, req.user.role);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { status, priority, assignee, tag, search, sort } = req.query;

    const query = { project: projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignees = assignee;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortObj = { order: 1, createdAt: -1 };
    if (sort === 'dueDate') sortObj = { dueDate: 1 };
    if (sort === 'priority') sortObj = { priority: 1 };
    if (sort === 'status') sortObj = { status: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('creator', 'name email avatar')
        .populate('assignees', 'name email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    // Attach dependency info to each task
    const tasksWithDeps = await Promise.all(
      tasks.map(async (task) => {
        const blocking = await taskDependencyService.checkBlocked(task._id);
        const json = task.toJSON();
        json.isBlocked = blocking.length > 0;
        json.blockedBy = blocking;
        return json;
      })
    );

    res.status(200).json({
      success: true,
      data: tasksWithDeps,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET TASK BY ID ──────────────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('project', 'name');

    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project._id, req.user._id, req.user.role);

    const blocking = await taskDependencyService.checkBlocked(task._id);
    const data = task.toJSON();
    data.isBlocked = blocking.length > 0;
    data.blockedBy = blocking;

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE TASK ─────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    // If status is changing, check dependencies
    if (req.body.status && req.body.status !== task.status && req.body.status !== 'Todo') {
      const blocking = await taskDependencyService.checkBlocked(task._id);
      if (blocking.length > 0) {
        throw new ApiError(
          `Task is blocked by: ${blocking.map((b) => b.title).join(', ')}. Complete dependencies first.`,
          400
        );
      }
    }

    const allowedFields = ['title', 'description', 'assignees', 'status', 'priority', 'dueDate', 'tags', 'subtasks', 'order'];
    const changes = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
        task[field] = req.body[field];
      }
    }

    await task.save();

    await ActivityLog.create({
      action: 'Updated task',
      entity: 'Task',
      entityId: task._id,
      user: req.user._id,
      project: task.project,
      details: { fields: Object.keys(changes) },
    });

    const populated = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('project', 'name');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE TASK STATUS ──────────────────────────────────────────
const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    const { status } = req.body;
    if (!status) throw new ApiError('Status is required', 400);

    // Check dependencies when advancing status
    if (status !== 'Todo') {
      const blocking = await taskDependencyService.checkBlocked(task._id);
      if (blocking.length > 0) {
        throw new ApiError(
          `Cannot move to "${status}" — blocked by: ${blocking.map((b) => b.title).join(', ')}`,
          400
        );
      }
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await ActivityLog.create({
      action: 'Changed task status',
      entity: 'Task',
      entityId: task._id,
      user: req.user._id,
      project: task.project,
      details: { from: oldStatus, to: status },
    });

    const populated = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('project', 'name');

    // Notify task creator and assignees (excluding the modifier)
    const updaterName = req.user.name || 'Someone';
    const recipients = new Set();
    if (populated.creator && populated.creator._id.toString() !== req.user._id.toString()) {
      recipients.add(populated.creator._id.toString());
    }
    if (populated.assignees && populated.assignees.length > 0) {
      populated.assignees.forEach((assignee) => {
        if (assignee._id.toString() !== req.user._id.toString()) {
          recipients.add(assignee._id.toString());
        }
      });
    }

    if (recipients.size > 0) {
      const notificationPromises = Array.from(recipients).map((recipientId) =>
        createNotification({
          recipient: recipientId,
          type: 'TASK_STATUS_CHANGED',
          title: 'Task status updated',
          message: `${updaterName} updated the status of "${task.title}" from "${oldStatus}" to "${status}"`,
          link: `/projects/${task.project}`,
          relatedEntity: { type: 'Task', id: task._id },
        })
      );
      Promise.all(notificationPromises).catch((err) => {
        console.error('Error sending task status update notifications:', err);
      });
    }

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE TASK ─────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    // Cascade delete dependencies
    await taskDependencyService.removeAllDependencies(task._id);
    await task.deleteOne();

    await ActivityLog.create({
      action: 'Deleted task',
      entity: 'Task',
      entityId: task._id,
      user: req.user._id,
      project: task.project,
      details: { title: task.title },
    });

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── REORDER TASKS (Kanban drag-and-drop) ────────────────────────
const reorderTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await assertAccess(projectId, req.user._id, req.user.role);

    const { tasks } = req.body;

    const bulkOps = tasks.map((t) => ({
      updateOne: {
        filter: { _id: t._id, project: projectId },
        update: { $set: { status: t.status, order: t.order } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: 'Tasks reordered' });
  } catch (error) {
    next(error);
  }
};

// ─── ADD SUBTASK ─────────────────────────────────────────────────
const addSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    task.subtasks.push({ title: req.body.title, completed: false });
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE SUBTASK ──────────────────────────────────────────────
const toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) throw new ApiError('Subtask not found', 404);

    subtask.completed = !subtask.completed;
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE SUBTASK ──────────────────────────────────────────────
const deleteSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError('Task not found', 404);

    await assertAccess(task.project, req.user._id, req.user.role);

    task.subtasks = task.subtasks.filter(
      (s) => s._id.toString() !== req.params.subtaskId
    );
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// ─── ADD DEPENDENCY ──────────────────────────────────────────────
const addDependency = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await assertAccess(projectId, req.user._id, req.user.role);

    const { predecessorId, successorId } = req.body;
    const relation = await taskDependencyService.addDependency(
      predecessorId,
      successorId,
      projectId
    );

    res.status(201).json({ success: true, data: relation });
  } catch (error) {
    next(error);
  }
};

// ─── REMOVE DEPENDENCY ──────────────────────────────────────────
const removeDependency = async (req, res, next) => {
  try {
    const { projectId, relationId } = req.params;
    await assertAccess(projectId, req.user._id, req.user.role);

    await taskDependencyService.removeDependency(relationId, projectId);

    res.status(200).json({ success: true, message: 'Dependency removed' });
  } catch (error) {
    next(error);
  }
};

// ─── GET DEPENDENCY GRAPH ────────────────────────────────────────
const getDependencyGraph = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await assertAccess(projectId, req.user._id, req.user.role);

    const graph = await taskDependencyService.getDependencyGraph(projectId);

    res.status(200).json({ success: true, data: graph });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY TASKS (across all projects) ──────────────────────────
const getMyTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { status, priority, sort } = req.query;

    const query = { assignees: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    let sortObj = { dueDate: 1, createdAt: -1 };
    if (sort === 'priority') sortObj = { priority: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project', 'name')
        .populate('creator', 'name email avatar')
        .populate('assignees', 'name email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
