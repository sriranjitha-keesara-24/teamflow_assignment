import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh token cookie
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh access token once if it expired
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    let errorData = error.response?.data;
    if (errorData instanceof Blob && errorData.type === "application/json") {
      try {
        const text = await errorData.text();
        errorData = JSON.parse(text);
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (error.response?.status === 401) {
      const isAuthUrl =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh");

      if (!isAuthUrl) {
        if (errorData?.code === "TOKEN_EXPIRED" && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              queue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const { data } = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            localStorage.setItem("accessToken", data.accessToken);
            processQueue(null, data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // General 401 on private routes: session is invalid/empty, redirect to login
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
