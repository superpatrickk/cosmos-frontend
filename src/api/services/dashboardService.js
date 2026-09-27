import axiosInstance from "../axiosInstance";

export const dashboardService = {
  getStats: () =>
    axiosInstance.get("/dashboard/stats"),

  getScheduleByDay: (day) =>
    axiosInstance.get(`/dashboard/schedule`, { params: { day } }),
};