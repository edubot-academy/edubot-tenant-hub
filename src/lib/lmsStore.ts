// Shared LMS store: classes, courses (templates), lessons, and class<->course assignments.
// Persisted in localStorage. Client-only — guard reads with typeof window checks if needed.

import { useEffect, useSyncExternalStore } from "react";

export type LessonType = "video" | "reading" | "quiz" | "assignment" | "live";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  lessons: Lesson[];
  createdAt: number;
  // future: modules?: Module[]
}

export interface ClassItem {
  id: string;
  title: string;
  code: string;
  students: number;
  nextSession: string;
  color: string;
  seed?: boolean;
}

export interface CourseAssignment {
  classId: string;
  courseId: string;
  startsOn?: string;
  assignedAt: number;
}

interface LmsState {
  classes: ClassItem[];
  courses: Course[];
  assignments: CourseAssignment[];
}

const KEY = "questlms.lms.v1";

const PALETTE = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-primary to-secondary",
  "from-secondary to-accent",
];

const SEED_CLASSES: ClassItem[] = [
  { id: "psych", title: "Cognitive Psychology", code: "PSY-201", students: 38, nextSession: "Today, 18:00", color: "from-primary to-primary/70", seed: true },
  { id: "chem", title: "Organic Chemistry II", code: "CHM-302", students: 24, nextSession: "Tomorrow, 10:00", color: "from-secondary to-secondary/70", seed: true },
  { id: "math", title: "Intro to Calculus", code: "MTH-101", students: 52, nextSession: "Thu, 14:00", color: "from-accent to-accent/70", seed: true },
  { id: "hist", title: "World History — Modern Era", code: "HST-210", students: 19, nextSession: "Fri, 09:00", color: "from-primary to-secondary", seed: true },
];

const SEED_COURSES: Course[] = [
  {
    id: "course-intro-psych",
    title: "Introduction to Cognitive Psychology",
    description: "Foundations of perception, memory, and reasoning.",
    subject: "Psychology",
    createdAt: Date.now() - 86400000 * 30,
    lessons: [
      { id: "l1", title: "What is Cognition?", type: "video", durationMin: 12 },
      { id: "l2", title: "Memory Models", type: "reading", durationMin: 20 },
      { id: "l3", title: "Quiz: Chapter 1", type: "quiz", durationMin: 10 },
    ],
  },
  {
    id: "course-org-chem",
    title: "Organic Chemistry Fundamentals",
    description: "Nomenclature, reactions, and mechanisms.",
    subject: "Chemistry",
    createdAt: Date.now() - 86400000 * 20,
    lessons: [
      { id: "l1", title: "Alkanes & Alkenes", type: "video", durationMin: 15 },
      { id: "l2", title: "Lab safety reading", type: "reading", durationMin: 8 },
    ],
  },
  {
    id: "course-calc-101",
    title: "Calculus 101",
    description: "Limits, derivatives, and integrals.",
    subject: "Math",
    createdAt: Date.now() - 86400000 * 10,
    lessons: [
      { id: "l1", title: "Limits intro", type: "video", durationMin: 18 },
      { id: "l2", title: "Derivative rules", type: "reading", durationMin: 25 },
      { id: "l3", title: "Practice set 1", type: "assignment", durationMin: 30 },
    ],
  },
];

const SEED_ASSIGNMENTS: CourseAssignment[] = [
  { classId: "psych", courseId: "course-intro-psych", assignedAt: Date.now() - 86400000 * 25 },
  { classId: "chem", courseId: "course-org-chem", assignedAt: Date.now() - 86400000 * 15 },
  { classId: "math", courseId: "course-calc-101", assignedAt: Date.now() - 86400000 * 8 },
];

function defaultState(): LmsState {
  return {
    classes: SEED_CLASSES,
    courses: SEED_COURSES,
    assignments: SEED_ASSIGNMENTS,
  };
}

let memoryState: LmsState = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LmsState>;
      memoryState = {
        classes: parsed.classes ?? SEED_CLASSES,
        courses: parsed.courses ?? SEED_COURSES,
        assignments: parsed.assignments ?? SEED_ASSIGNMENTS,
      };
    }
  } catch {}
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memoryState));
  } catch {}
}

function emit() {
  listeners.forEach((l) => l());
}

function setState(updater: (s: LmsState) => LmsState) {
  memoryState = updater(memoryState);
  persist();
  emit();
}

export function useLms() {
  // SSR-safe subscription
  const state = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => memoryState,
    () => memoryState,
  );

  useEffect(() => {
    if (!hydrated) {
      load();
      emit();
    }
  }, []);

  return state;
}

// --- Class actions ---
export function nextClassColor() {
  return PALETTE[(memoryState.classes.length) % PALETTE.length];
}

export function createClass(input: { title: string; code: string; students: number; nextSession: string }) {
  const item: ClassItem = {
    id: `cls-${Date.now()}`,
    title: input.title,
    code: input.code.toUpperCase(),
    students: input.students,
    nextSession: input.nextSession || "TBA",
    color: nextClassColor(),
  };
  setState((s) => ({ ...s, classes: [item, ...s.classes] }));
  return item;
}

export function getClass(id: string) {
  return memoryState.classes.find((c) => c.id === id);
}

// --- Course actions ---
export function createCourse(input: { title: string; description?: string; subject?: string }) {
  const item: Course = {
    id: `crs-${Date.now()}`,
    title: input.title,
    description: input.description,
    subject: input.subject,
    lessons: [],
    createdAt: Date.now(),
  };
  setState((s) => ({ ...s, courses: [item, ...s.courses] }));
  return item;
}

export function getCourse(id: string) {
  return memoryState.courses.find((c) => c.id === id);
}

export function addLesson(courseId: string, input: { title: string; type: LessonType; durationMin?: number }) {
  const lesson: Lesson = {
    id: `lsn-${Date.now()}`,
    title: input.title,
    type: input.type,
    durationMin: input.durationMin,
  };
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) =>
      c.id === courseId ? { ...c, lessons: [...c.lessons, lesson] } : c,
    ),
  }));
  return lesson;
}

export function deleteLesson(courseId: string, lessonId: string) {
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) =>
      c.id === courseId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c,
    ),
  }));
}

// --- Assignment actions ---
export function assignCourse(classId: string, courseId: string) {
  setState((s) => {
    if (s.assignments.some((a) => a.classId === classId && a.courseId === courseId)) return s;
    return {
      ...s,
      assignments: [...s.assignments, { classId, courseId, assignedAt: Date.now() }],
    };
  });
}

export function unassignCourse(classId: string, courseId: string) {
  setState((s) => ({
    ...s,
    assignments: s.assignments.filter((a) => !(a.classId === classId && a.courseId === courseId)),
  }));
}

export function coursesForClass(state: LmsState, classId: string) {
  const ids = state.assignments.filter((a) => a.classId === classId).map((a) => a.courseId);
  return state.courses.filter((c) => ids.includes(c.id));
}

export function classesForCourse(state: LmsState, courseId: string) {
  const ids = state.assignments.filter((a) => a.courseId === courseId).map((a) => a.classId);
  return state.classes.filter((c) => ids.includes(c.id));
}
