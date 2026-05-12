import axiosInstance from "../axiosInstance";

export const printableService = {
  getSchedule: (params) =>
    axiosInstance.get("/schedules/printable", { params }),

  exportPdf: (params) =>
    axiosInstance.get("/schedules/export-pdf", {
      params,
      responseType: "blob",
    }),
};