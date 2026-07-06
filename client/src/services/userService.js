import api from "./api";

export const adminGetUsersList = () =>
  api.get("/users/admin/list").then((res) => res.data);

export const toggleUserActivation = (id) =>
  api.put(`/users/${id}/status`).then((res) => res.data);

export const adminGetAuditLogs = () =>
  api.get("/users/admin/audit-logs").then((res) => res.data);
