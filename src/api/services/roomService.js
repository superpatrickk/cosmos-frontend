import axiosInstance from "../axiosInstance";

export const roomService = {
  getAll: (params) =>
    axiosInstance.get("/rooms", { params }),

  getById: (id) =>
    axiosInstance.get(`/rooms/${id}`),

  create: (data) =>
    axiosInstance.post("/rooms", data),

  update: (id, data) =>
    axiosInstance.put(`/rooms/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/rooms/${id}`),

  export: () =>
    axiosInstance.get("/rooms/export", { responseType: "blob" }),
};