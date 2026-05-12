import axiosInstance from "../axiosInstance";

export const emailService = {
  sendScheduleToFaculty: (facultyId) =>
    axiosInstance.post(`/email/send-schedule/${facultyId}`),

  sendScheduleToAll: () =>
    axiosInstance.post("/email/send-schedule/all"),
};