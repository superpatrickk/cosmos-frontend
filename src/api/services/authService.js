import axiosInstance from "../axiosInstance";

export const authService = {
  login: (credentials) =>
    axiosInstance.post("/auth/login", credentials),

  logout: () =>
    axiosInstance.post("/auth/logout"),

  refreshToken: () =>
    axiosInstance.post("/auth/refresh"),
};