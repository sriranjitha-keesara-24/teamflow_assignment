import api from "./api";

export const getProjects = async (params = {}) => {
  const { data } = await api.get("/projects", { params });
  return data;
};

export const getProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data;
};

export const createProject = async (payload) => {
  const { data } = await api.post("/projects", payload);
  return data;
};

export const updateProject = async (id, payload) => {
  const { data } = await api.put(`/projects/${id}`, payload);
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
};

export const setArchiveStatus = async (id, archived) => {
  const { data } = await api.put(`/projects/${id}`, { status: archived ? "Archived" : "Active" });
  return { project: data.data || data, message: `Project successfully ${archived ? "archived" : "activated"}` };
};

export const getProjectStats = async (id) => {
  const { data } = await api.get(`/projects/${id}/stats`);
  return data;
};

export const addMember = async (id, userId, role) => {
  const { data } = await api.post(`/projects/${id}/members`, { userId, role });
  return data;
};

export const updateMemberRole = async (id, userId, role) => {
  const { data } = await api.put(`/projects/${id}/members/${userId}/role`, { role });
  return data;
};

export const removeMember = async (id, userId) => {
  const { data } = await api.delete(`/projects/${id}/members/${userId}`);
  return data;
};

export const searchUsers = async (search) => {
  const { data } = await api.get("/users", { params: { search } });
  return data;
};

export const getProjectActivities = async (id) => {
  const { data } = await api.get(`/projects/${id}/activities`);
  return data;
};

