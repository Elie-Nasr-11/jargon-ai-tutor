// Mock state shared via localStorage + a tiny pub/sub.
export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  progress: number; // 0..1
};

export const LESSONS: Lesson[] = [
  { id: "vars", title: "Variables & Types", subtitle: "Names, values, and the shapes data takes.", progress: 0.62 },
  { id: "flow", title: "Control Flow", subtitle: "If, else, loops — the grammar of decisions.", progress: 0.28 },
  { id: "fns", title: "Functions", subtitle: "Reusable thought. Arguments and returns.", progress: 0.0 },
  { id: "async", title: "Async & Promises", subtitle: "Time as a first-class citizen.", progress: 0.0 },
  { id: "data", title: "Data Structures", subtitle: "Arrays, maps, sets, trees.", progress: 0.0 },
];

export type MentorConfig = {
  tone: "Friendly" | "Direct" | "Socratic";
  verbosity: "Concise" | "Balanced" | "Detailed";
  difficulty: "Gentle" | "Standard" | "Challenging";
};

export const DEFAULT_MENTOR: MentorConfig = {
  tone: "Socratic",
  verbosity: "Balanced",
  difficulty: "Standard",
};

const KEYS = {
  user: "jargon_user",
  lesson: "jargon_lesson",
  mentor: "jargon_mentor",
} as const;

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("jargon:store", { detail: { key: k } }));
}

export const store = {
  getUser: () => read<string | null>(KEYS.user, null),
  setUser: (email: string) => write(KEYS.user, email),
  clearUser: () => {
    if (typeof window !== "undefined") localStorage.removeItem(KEYS.user);
    window.dispatchEvent(new CustomEvent("jargon:store", { detail: { key: KEYS.user } }));
  },
  getLessonId: () => read<string>(KEYS.lesson, LESSONS[0].id),
  setLessonId: (id: string) => write(KEYS.lesson, id),
  getMentor: () => read<MentorConfig>(KEYS.mentor, DEFAULT_MENTOR),
  setMentor: (m: MentorConfig) => write(KEYS.mentor, m),
};
