const Task = require('../models/Task');
const RCA = require('../models/RCA');
const Project = require('../models/Project');
const mongoose = require('mongoose');

const getTasksByStatus = async (projectId, startDate, endDate) => {
  const matchQuery = { project: new mongoose.Types.ObjectId(projectId) };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const stats = await Task.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result = { Todo: 0, 'In Progress': 0, Review: 0, Completed: 0 };
  stats.forEach((item) => {
    if (result[item._id] !== undefined) {
      result[item._id] = item.count;
    }
  });

  return result;
};

const getTaskCompletionRate = async (projectId, startDate, endDate) => {
  const matchQuery = { project: new mongoose.Types.ObjectId(projectId) };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const counts = await Task.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
      },
    },
  ]);

  if (counts.length === 0) {
    return { total: 0, completed: 0, rate: 0 };
  }

  const { total, completed } = counts[0];
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, rate };
};

const getOverdueTasksCount = async (projectId, startDate, endDate) => {
  const now = new Date();
  const query = {
    project: projectId,
    status: { $ne: 'Completed' },
    dueDate: { $lt: now },
  };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const count = await Task.countDocuments(query);
  return count;
};

const getRCAStats = async (projectId, startDate, endDate) => {
  const matchQuery = { project: new mongoose.Types.ObjectId(projectId) };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const stats = await RCA.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result = { Draft: 0, Submitted: 0, 'Under Review': 0, Approved: 0, Rejected: 0, 'Needs Revision': 0 };
  let total = 0;
  stats.forEach((item) => {
    if (result[item._id] !== undefined) {
      result[item._id] = item.count;
      total += item.count;
    }
  });

  return { total, statuses: result };
};

const getTeamWorkload = async (projectId, startDate, endDate) => {
  const matchQuery = { project: new mongoose.Types.ObjectId(projectId) };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const workload = await Task.aggregate([
    { $match: matchQuery },
    { $unwind: '$assignees' },
    {
      $group: {
        _id: '$assignees',
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
        pendingTasks: {
          $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        avatar: '$user.avatar',
        totalTasks: 1,
        completedTasks: 1,
        pendingTasks: 1,
      },
    },
  ]);

  return workload;
};

const getProjectHealth = async (projectId, startDate, endDate) => {
  const now = new Date();
  const query = { project: projectId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const tasks = await Task.find(query);

  if (tasks.length === 0) {
    return 'On Track';
  }

  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const overdue = tasks.filter((t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now).length;

  if (overdue > tasks.length * 0.1) {
    return 'Delayed';
  } else if (overdue > 0) {
    return 'At Risk';
  }
  return 'On Track';
};

const getRCAOverTime = async (projectId, startDate, endDate) => {
  const matchQuery = { project: new mongoose.Types.ObjectId(projectId) };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const rcaTrend = await RCA.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rcaTrend.map((t) => ({ date: t._id, count: t.count }));
};

const getProjectReportData = async (projectId, startDate, endDate) => {
  const [status, completion, overdue, rca, workload, health, rcaTrend] = await Promise.all([
    getTasksByStatus(projectId, startDate, endDate),
    getTaskCompletionRate(projectId, startDate, endDate),
    getOverdueTasksCount(projectId, startDate, endDate),
    getRCAStats(projectId, startDate, endDate),
    getTeamWorkload(projectId, startDate, endDate),
    getProjectHealth(projectId, startDate, endDate),
    getRCAOverTime(projectId, startDate, endDate),
  ]);

  return {
    projectId,
    health,
    taskStats: {
      status,
      completion,
      overdue,
    },
    rcaStats: rca,
    teamWorkload: workload,
    rcaTrend,
  };
};

module.exports = {
  getTasksByStatus,
  getTaskCompletionRate,
  getOverdueTasksCount,
  getRCAStats,
  getTeamWorkload,
  getProjectHealth,
  getRCAOverTime,
  getProjectReportData,
};
