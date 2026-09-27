import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  withCredentials: true, // sends HttpOnly refresh token cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR
// Automatically attaches the access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Access token is stored in memory via AuthContext
    // We retrieve it from a module-level variable set by AuthContext
    const token = window.__cosmos_access_token__;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
// Handles token expiry (401) globally — attempts silent refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authEndpoints = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/me"];
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest?.url?.endsWith(endpoint)
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Ask backend to issue a new access token using the HttpOnly refresh cookie
        const res = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;
        window.__cosmos_access_token__ = newToken;

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token also expired — force logout
        window.__cosmos_access_token__ = null;
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;