const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const taskDependencyService = require('../Services/TaskDependencyService');
const { ApiError } = require('../middleware/errorMiddleware');
const { createNotification } = require('../Services/NotificationService');

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

// Helper: handle auto-creation of recurring tasks on completion
const handleRecurringTask = async (task, oldStatus, newStatus, modifierId) => {
  if (newStatus === 'Completed' && task.recurrence && task.recurrence !== 'None' && oldStatus !== 'Completed') {
    try {
      let nextDueDate = null;
      if (task.dueDate) {
        nextDueDate = new Date(task.dueDate);
        if (task.recurrence === 'Daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurrence === 'Weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrence === 'Monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
      } else {
        nextDueDate = new Date();
        if (task.recurrence === 'Daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurrence === 'Weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrence === 'Monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
      }

      const nextTask = await Task.create({
        title: task.title,
        description: task.description,
        project: task.project,
        creator: task.creator,
        assignees: task.assignees,
        status: 'Todo',
        priority: task.priority,
        dueDate: nextDueDate,
        tags: task.tags,
        recurrence: task.recurrence,
        subtasks: task.subtasks.map(s => ({ title: s.title, completed: false })),
        order: task.order
      });

      await ActivityLog.create({
        action: 'Created task (Recurring)',
        entity: 'Task',
        entityId: nextTask._id,
        user: modifierId,
        project: task.project,
        details: { title: nextTask.title, parentId: task._id }
      });
    } catch (err) {
      console.error('Error auto-creating recurring task:', err);
    }
  }
};

// ─── CREATE TASK ─────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { project: projectId, title, description, assignees, status, priority, dueDate, tags, subtasks, recurrence } = req.body;

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
      recurrence: recurrence || 'None',
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

    const oldStatus = task.status;
    const allowedFields = ['title', 'description', 'assignees', 'status', 'priority', 'dueDate', 'tags', 'subtasks', 'order', 'recurrence'];
    const changes = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
        task[field] = req.body[field];
      }
    }

    await task.save();

    if (req.body.status) {
      await handleRecurringTask(task, oldStatus, req.body.status, req.user._id);
    }

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

    await handleRecurringTask(task, oldStatus, status, req.user._id);

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

// @desc    Start timer for a task
// @route   POST /api/v1/projects/:projectId/tasks/:id/timer/start
// @access  Private (Project members only)
const startTaskTimer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) throw new ApiError('Task not found', 404);

        await assertAccess(task.project, req.user._id, req.user.role);

        // Check if there is already an active timer for this user on this task
        if (task.activeTimer && task.activeTimer.user && task.activeTimer.user.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Timer is already running for you on this task' });
        }

        // Set active timer
        task.activeTimer = {
            user: req.user._id,
            startTime: new Date()
        };
        await task.save();

        res.status(200).json({ success: true, activeTimer: task.activeTimer });
    } catch (error) {
        next(error);
    }
};

// @desc    Stop timer and record time log
// @route   POST /api/v1/projects/:projectId/tasks/:id/timer/stop
// @access  Private (Project members only)
const stopTaskTimer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const task = await Task.findById(id);
        if (!task) throw new ApiError('Task not found', 404);

        await assertAccess(task.project, req.user._id, req.user.role);

        const active = task.activeTimer;
        if (!active || !active.user || active.user.toString() !== req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'No active timer found for you on this task' });
        }

        const startTime = active.startTime;
        const endTime = new Date();
        // Calculate duration in minutes (round to 1 decimal place)
        const duration = Math.max(0.1, parseFloat(((endTime - startTime) / 60000).toFixed(1)));

        // Create time log
        const logEntry = {
            user: req.user._id,
            startTime,
            endTime,
            duration,
            description: description || 'Timer log'
        };

        task.timeLogs.push(logEntry);
        task.activeTimer = null; // Clear active timer
        await task.save();

        res.status(200).json({ success: true, timeLogs: task.timeLogs, newLog: logEntry });
    } catch (error) {
        next(error);
    }
};

// @desc    Manually log time for a task
// @route   POST /api/v1/projects/:projectId/tasks/:id/time-log
// @access  Private (Project members only)
const logTaskTimeManually = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { duration, description, startTime } = req.body;

        if (!duration || isNaN(duration) || parseFloat(duration) <= 0) {
            throw new ApiError('Please provide a valid duration in minutes', 400);
        }

        const task = await Task.findById(id);
        if (!task) throw new ApiError('Task not found', 404);

        await assertAccess(task.project, req.user._id, req.user.role);

        const sTime = startTime ? new Date(startTime) : new Date();
        const eTime = new Date(sTime.getTime() + duration * 60000);

        const logEntry = {
            user: req.user._id,
            startTime: sTime,
            endTime: eTime,
            duration: parseFloat(duration),
            description: description || 'Manual log'
        };

        task.timeLogs.push(logEntry);
        await task.save();

        res.status(200).json({ success: true, timeLogs: task.timeLogs, newLog: logEntry });
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
  startTaskTimer,
  stopTaskTimer,
  logTaskTimeManually,
};
