import axiosInstance from "../axiosInstance";

export const curriculumService = {
  getAll: (params) =>
    axiosInstance.get("/curriculum", { params }),

  getById: (id) =>
    axiosInstance.get(`/curriculum/${id}`),

  create: (data) =>
    axiosInstance.post("/curriculum", data),

  update: (id, data) =>
    axiosInstance.put(`/curriculum/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/curriculum/${id}`),

  getLatest: (program, yearLevel, semester) =>
    axiosInstance.get("/curriculum/latest", {
      params: { program, yearLevel, semester },
    }),

  getAvailableFaculty: (day, startTime, endTime) =>
    axiosInstance.get("/curriculum/available-faculty", {
      params: { day, startTime, endTime },
    }),

  saveSchedules: (data) =>
    axiosInstance.post("/curriculum/save-schedules", data),
};