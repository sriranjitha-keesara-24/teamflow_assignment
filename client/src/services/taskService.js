import api from "./api";

export const taskService = {
  list: (projectId, filters = {}) =>
    api.get(`/projects/${projectId}/tasks/project/${projectId}`, { params: filters }).then((r) => r.data),

  get: (projectId, taskId) =>
    api.get(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/tasks`, { ...payload, project: projectId }).then((r) => r.data),

  update: (projectId, taskId, payload) =>
    api.put(`/projects/${projectId}/tasks/${taskId}`, payload).then((r) => r.data),

  updateStatus: (projectId, taskId, status) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status }).then((r) => r.data),

  remove: (projectId, taskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  // Personal tasks cross-project
  getMyTasks: (params = {}) =>
    api.get("/projects/all/tasks/my-tasks", { params }).then((r) => r.data),

  // Kanban reordering
  reorder: (projectId, tasks) =>
    api.put(`/projects/${projectId}/tasks/project/${projectId}/reorder`, { tasks }).then((r) => r.data),

  // Subtasks
  addSubtask: (projectId, taskId, title) =>
    api.post(`/projects/${projectId}/tasks/${taskId}/subtasks`, { title }).then((r) => r.data),

  toggleSubtask: (projectId, taskId, subtaskId) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}/toggle`).then((r) => r.data),

  deleteSubtask: (projectId, taskId, subtaskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`).then((r) => r.data),

  // Dependencies
  getDependencyGraph: (projectId) =>
    api.get(`/projects/${projectId}/tasks/project/${projectId}/dependencies`).then((r) => r.data),

  addDependency: (projectId, predecessorId, successorId) =>
    api.post(`/projects/${projectId}/tasks/project/${projectId}/dependencies`, { predecessorId, successorId }).then((r) => r.data),

  removeDependency: (projectId, relationId) =>
    api.delete(`/projects/${projectId}/tasks/project/${projectId}/dependencies/${relationId}`).then((r) => r.data),

  getTasks: (projectId) =>
    api.get(`/projects/${projectId}/tasks/project/${projectId}`),
};

export default taskService;