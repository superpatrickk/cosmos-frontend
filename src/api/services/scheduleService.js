import axiosInstance from "../axiosInstance";

export const scheduleService = {
  getAll: (params) =>
    axiosInstance.get("/schedules", { params }),

  create: (data) =>
    axiosInstance.post("/schedules", data),

  update: (id, data) =>
    axiosInstance.put(`/schedules/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/schedules/${id}`),

  checkConflicts: (data) =>
    axiosInstance.post("/schedules/check-conflicts", data),
};