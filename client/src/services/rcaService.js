import api from './api';

export const rcaService = {
  // Project-scoped
  getByProject: (projectId, params) =>
    api.get(`/projects/${projectId}/rca`, { params }).then((r) => r.data),

  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/rca`, payload).then((r) => r.data),

  // Standalone (cross-project)
  getAll: (params) =>
    api.get('/rca', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/rca/${id}`).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/rca/${id}`, payload).then((r) => r.data),

  delete: (id) =>
    api.delete(`/rca/${id}`).then((r) => r.data),

  submit: (id) =>
    api.put(`/rca/${id}/submit`).then((r) => r.data),

  review: (id, payload) =>
    api.put(`/rca/${id}/review`, payload).then((r) => r.data),

  reassign: (id, payload) =>
    api.put(`/rca/${id}/reassign`, payload).then((r) => r.data),

  escalate: (id) =>
    api.put(`/rca/${id}/escalate`).then((r) => r.data),

  // Aliases for user-specified code layout
  getRCAs: (projectId, params) =>
    api.get(`/projects/${projectId}/rca`, { params }).then((r) => r.data),

  getAllRCAs: (params) =>
    api.get('/rca', { params }).then((r) => r.data),

  createRCA: (projectId, payload) =>
    api.post(`/projects/${projectId}/rca`, payload).then((r) => r.data),

  getRCA: (id) =>
    api.get(`/rca/${id}`).then((r) => r.data),

  submitRCA: (id) =>
    api.put(`/rca/${id}/submit`).then((r) => r.data),

  reviewRCA: (id, decision, reviewComments) =>
    api.put(`/rca/${id}/review`, { decision, reviewComments }).then((r) => r.data),

  updateRCA: (id, payload) =>
    api.put(`/rca/${id}`, payload).then((r) => r.data),

  deleteRCA: (id) =>
    api.delete(`/rca/${id}`).then((r) => r.data),
};
