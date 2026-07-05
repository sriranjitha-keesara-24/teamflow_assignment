import api from "./api";

export const commentService = {
  getComments: (taskId) =>
    api.get(`/tasks/${taskId}/comments`).then((r) => r.data),

  createComment: (taskId, content, mentions = []) =>
    api.post(`/tasks/${taskId}/comments`, { content, mentions }).then((r) => r.data),

  updateComment: (taskId, commentId, content, mentions = []) =>
    api.put(`/tasks/${taskId}/comments/${commentId}`, { content, mentions }).then((r) => r.data),

  deleteComment: (taskId, commentId) =>
    api.delete(`/tasks/${taskId}/comments/${commentId}`).then((r) => r.data),
};
