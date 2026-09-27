import axiosInstance from "../axiosInstance";

export const courseService = {
  getAll: (params) =>
    axiosInstance.get("/courses", { params }),

  getById: (id) =>
    axiosInstance.get(`/courses/${id}`),

  create: (data) =>
    axiosInstance.post("/courses", data),

  update: (id, data) =>
    axiosInstance.put(`/courses/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/courses/${id}`),
};