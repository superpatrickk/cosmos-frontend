const STORAGE_KEY = "cosmos.curricula";

export const DEFAULT_CURRICULA = [
  {
    id: "CUR001",
    program: "BSIT",
    yearLevel: "3rd Year",
    semester: "1st Semester",
    academicYear: "2025-2026",
    totalSubjects: 7,
    totalUnits: 21,
    status: "Active",
    subjects: [
      { code: "COMP 019", description: "Applications Development and Emerging Technologies", lec: 2, lab: 3, units: 3, type: "Lecture/Lab", roomType: "Computer Lab", faculty: "Dr. Maria Santos" },
      { code: "ELEC IT-F3", description: "IT Elective 2", lec: 2, lab: 3, units: 3, type: "Lecture/Lab", roomType: "Computer Lab", faculty: "Prof. Juan Reyes" },
      { code: "GEED 005", description: "The Contemporary World", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Lecture", faculty: "Dr. Maria Santos" },
      { code: "GEED 010", description: "People and the Earth's Ecosystems", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Lecture", faculty: "Prof. Juan Reyes" },
      { code: "HRMA 001", description: "Principles of Organization and Management", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Seminar", faculty: "Prof. Juan Reyes" },
      { code: "INTE 300", description: "Information Assurance and Security 1", lec: 2, lab: 3, units: 3, type: "Lecture/Lab", roomType: "Computer Lab", faculty: "Prof. Carlos Garcia" },
      { code: "INTE 301", description: "Capstone Project 1", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Lecture", faculty: "Dr. Maria Santos" },
    ],
  },
  {
    id: "CUR002",
    program: "BSCS",
    yearLevel: "2nd Year",
    semester: "1st Semester",
    academicYear: "2025-2026",
    totalSubjects: 3,
    totalUnits: 9,
    status: "Active",
    subjects: [
      { code: "CS 201", description: "Data Structures and Algorithms", lec: 2, lab: 3, units: 3, type: "Lecture/Lab", roomType: "Computer Lab", faculty: "Dr. Ana Cruz" },
      { code: "CS 202", description: "Discrete Mathematics", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Lecture", faculty: "Dr. Maria Santos" },
      { code: "MATH 201", description: "Calculus II", lec: 3, lab: 0, units: 3, type: "Lecture", roomType: "Lecture", faculty: "Dr. Ana Cruz" },
    ],
  },
];

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

const inferTags = (subject) => {
  const text = `${subject.code || ""} ${subject.description || ""}`.toLowerCase();
  const tags = [];

  if (/app|web|software|capstone|data structures/.test(text)) tags.push("software");
  if (/security|assurance|systems|network/.test(text)) tags.push("systems", "security");
  if (/math|calculus|discrete/.test(text)) tags.push("math", "algorithms");
  if (/management|organization|business/.test(text)) tags.push("management");
  if (/ecosystem|environment/.test(text)) tags.push("environment");
  if (/world|geed|contemporary/.test(text)) tags.push("general");

  return [...new Set(tags.length ? tags : ["general"])];
};

export const loadCurricula = () => {
  if (!canUseStorage()) return DEFAULT_CURRICULA;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CURRICULA;
  } catch {
    return DEFAULT_CURRICULA;
  }
};

export const saveCurricula = (curricula) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(curricula));
};

export const normalizeSchedulingCurriculum = (curriculum) => ({
  ...curriculum,
  version: curriculum.version || `${curriculum.program} ${curriculum.academicYear} Curriculum`,
  subjects: (curriculum.subjects || []).map((subject, index) => ({
    id: subject.id || `${curriculum.id}-S${String(index + 1).padStart(3, "0")}`,
    code: subject.code,
    description: subject.description,
    lec: Number(subject.lec || 0),
    lab: Number(subject.lab || 0),
    units: Number(subject.units || 0),
    type: subject.type || subject.roomType || "Lecture",
    roomType: subject.roomType || subject.type || "Lecture",
    tags: subject.tags || inferTags(subject),
  })),
});
