import axiosInstance from "../axiosInstance";

export const facultyService = {
  getAll: (params) =>
    axiosInstance.get("/faculty", { params }),

  getById: (id) =>
    axiosInstance.get(`/faculty/${id}`),

  create: (data) =>
    axiosInstance.post("/faculty", data),

  update: (id, data) =>
    axiosInstance.put(`/faculty/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/faculty/${id}`),
};