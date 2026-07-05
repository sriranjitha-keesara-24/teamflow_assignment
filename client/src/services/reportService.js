import api from "./api";

export const reportService = {
  getDashboardReport: (projectId) =>
    api.get(`/projects/${projectId}/reports/dashboard`).then((r) => r.data),

  exportProjectData: (projectId, type = "tasks") =>
    api.get(`/projects/${projectId}/reports/export`, { params: { type }, responseType: "blob" }),
};
