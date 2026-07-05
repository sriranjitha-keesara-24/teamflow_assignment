import api from "./api";

export const registerUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const logoutAllDevices = async () => {
  const { data } = await api.post("/auth/logout-all");
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
};

export const verifyEmail = async (token) => {
  const { data } = await api.get(`/auth/verify-email/${token}`);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const updateUserProfile = async (payload) => {
  const { data } = await api.put("/users/profile", payload);
  return data;
};

export const uploadAvatar = async (formData) => {
  const { data } = await api.put("/users/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
