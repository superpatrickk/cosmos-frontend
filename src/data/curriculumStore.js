const STORAGE_KEY = "cosmos.curricula";

export const DEFAULT_CURRICULA = [];

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
