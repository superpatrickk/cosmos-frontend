import axiosInstance from "../axiosInstance";

export const authService = {
  login: (credentials) =>
    axiosInstance.post("/auth/login", credentials),

  logout: () =>
    axiosInstance.post("/auth/logout"),

  refreshToken: () =>
    axiosInstance.post("/auth/refresh"),

  getCurrentUser: () =>
    axiosInstance.get("/auth/me"),

  updateProfile: (profile) =>
    axiosInstance.put("/auth/me/profile", profile),

  requestPasswordReset: (email) =>
    axiosInstance.post("/auth/forgot-password", { email }),

  resetPassword: (credentials) =>
    axiosInstance.post("/auth/reset-password", credentials),
};