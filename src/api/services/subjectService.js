import axiosInstance from "../axiosInstance";

export const subjectService = {
  getAll: (params) =>
    axiosInstance.get("/subjects", { params }),

  getById: (id) =>
    axiosInstance.get(`/subjects/${id}`),

  create: (data) =>
    axiosInstance.post("/subjects", data),

  update: (id, data) =>
    axiosInstance.put(`/subjects/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/subjects/${id}`),
};