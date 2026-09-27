import axiosInstance from "../axiosInstance";

// Helper to try plural or singular endpoints for compatibility with different backends
const tryBoth = async (method, pathSingular, pathPlural, ...args) => {
  try {
    return await axiosInstance[method](pathSingular, ...args);
  } catch (err) {
    // if not found or server uses plural, try the plural path
    try {
      return await axiosInstance[method](pathPlural, ...args);
    } catch (err2) {
      // rethrow original for better trace
      throw err2 || err;
    }
  }
};

export const curriculumService = {
  getAll: (params) => tryBoth("get", "/curriculum", "/curricula", { params }),

  getById: (id) => tryBoth("get", `/curriculum/${id}`, `/curricula/${id}`),

  create: (data) => tryBoth("post", "/curriculum", "/curricula", data),

  update: (id, data) => tryBoth("put", `/curriculum/${id}`, `/curricula/${id}`, data),

  delete: (id) => tryBoth("delete", `/curriculum/${id}`, `/curricula/${id}`),

  getLatest: (program, yearLevel, semester) => tryBoth(
    "get",
    "/curriculum/latest",
    "/curricula/latest",
    { params: { program, yearLevel, semester } }
  ),

  getAvailableFaculty: (day, startTime, endTime) => tryBoth(
    "get",
    "/curriculum/available-faculty",
    "/curricula/available-faculty",
    { params: { day, startTime, endTime } }
  ),

  saveSchedules: (data) => tryBoth("post", "/curriculum/save-schedules", "/curricula/save-schedules", data),
};