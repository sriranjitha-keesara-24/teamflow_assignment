const TaskRelation = require('../models/TaskRelation');
const Task = require('../models/Task');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * Add a dependency: predecessor must complete before successor can progress.
 * Validates both tasks exist, belong to the same project, and no circular dependency.
 */
const addDependency = async (predecessorId, successorId, projectId) => {
  if (predecessorId === successorId) {
    throw new ApiError('A task cannot depend on itself', 400);
  }

  // Verify both tasks exist and belong to the project
  const [predecessor, successor] = await Promise.all([
    Task.findOne({ _id: predecessorId, project: projectId }),
    Task.findOne({ _id: successorId, project: projectId }),
  ]);

  if (!predecessor || !successor) {
    throw new ApiError('One or both tasks not found in this project', 404);
  }

  // Check for circular dependency using BFS
  const visited = new Set();
  const queue = [predecessorId.toString()];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === successorId.toString()) {
      // We'd be creating: successor → ... → predecessor → successor (cycle)
      // But we're checking if predecessor is already reachable from successor
      // So we need to check the other direction
    }
    visited.add(current);

    // Find all tasks that the current task depends on (where current is the successor)
    const deps = await TaskRelation.find({ successor: current });
    for (const dep of deps) {
      const predId = dep.predecessor.toString();
      if (predId === successorId.toString()) {
        throw new ApiError(
          'Cannot add dependency — this would create a circular dependency chain',
          400
        );
      }
      if (!visited.has(predId)) {
        queue.push(predId);
      }
    }
  }

  // Check if dependency already exists
  const existing = await TaskRelation.findOne({
    predecessor: predecessorId,
    successor: successorId,
  });

  if (existing) {
    throw new ApiError('This dependency already exists', 400);
  }

  const relation = await TaskRelation.create({
    predecessor: predecessorId,
    successor: successorId,
    project: projectId,
  });

  return relation;
};

/**
 * Remove a dependency.
 */
const removeDependency = async (relationId, projectId) => {
  const relation = await TaskRelation.findOneAndDelete({
    _id: relationId,
    project: projectId,
  });

  if (!relation) {
    throw new ApiError('Dependency not found', 404);
  }

  return relation;
};

/**
 * Check if a task is blocked (has incomplete predecessors).
 * Returns an array of blocking task objects.
 */
const checkBlocked = async (taskId) => {
  const relations = await TaskRelation.find({ successor: taskId }).populate(
    'predecessor',
    'title status'
  );

  const blocking = relations
    .filter((r) => r.predecessor && r.predecessor.status !== 'Completed')
    .map((r) => ({
      _id: r.predecessor._id,
      title: r.predecessor.title,
      status: r.predecessor.status,
      relationId: r._id,
    }));

  return blocking;
};

/**
 * Get all dependencies for a project (adjacency list for visualization).
 */
const getDependencyGraph = async (projectId) => {
  const relations = await TaskRelation.find({ project: projectId })
    .populate('predecessor', 'title status')
    .populate('successor', 'title status');

  return relations;
};

/**
 * Handle cascade when a task is deleted — remove all its dependency relations.
 */
const removeAllDependencies = async (taskId) => {
  await TaskRelation.deleteMany({
    $or: [{ predecessor: taskId }, { successor: taskId }],
  });
};

module.exports = {
  addDependency,
  removeDependency,
  checkBlocked,
  getDependencyGraph,
  removeAllDependencies,
};
