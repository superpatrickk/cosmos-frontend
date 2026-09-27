import axiosInstance from "../axiosInstance";

export const facultyScheduleService = {
  getAll: () =>
    axiosInstance.get("/faculty-schedule"),

  getByFacultyId: (facultyId) =>
    axiosInstance.get(`/faculty-schedule/${facultyId}`),

  setAvailability: (facultyId, data) =>
    axiosInstance.post(`/faculty-schedule/${facultyId}/availability`, data),

  updateAvailability: (facultyId, data) =>
    axiosInstance.put(`/faculty-schedule/${facultyId}/availability`, data),
};