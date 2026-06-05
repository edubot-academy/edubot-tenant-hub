// Shared LMS store: tenant hierarchy config, classes, courses (templates), modules,
// lessons, and class<->course assignments. Persisted in localStorage.

import { useEffect, useSyncExternalStore } from "react";

export type LessonType = "video" | "reading" | "quiz" | "assignment" | "live";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin?: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  lessons: Lesson[]; // ungrouped lessons (always allowed)
  modules: Module[]; // grouped lessons (visible only when hierarchy.modulesEnabled)
  createdAt: number;
}

export interface ClassItem {
  id: string;
  title: string;
  code: string;
  students: number;
  nextSession: string;
  color: string;
  seed?: boolean;
  lessons: Lesson[]; // direct lessons (used when hierarchy.coursesEnabled is false)
}

export interface CourseAssignment {
  classId: string;
  courseId: string;
  startsOn?: string;
  assignedAt: number;
}

export interface HierarchyConfig {
  coursesEnabled: boolean;
  modulesEnabled: boolean;
}

export interface LessonSchedule {
  classId: string;
  lessonId: string;
  startAt?: string; // ISO
  dueAt?: string;   // ISO (mainly for assignments/quizzes)
}

interface LmsState {
  classes: ClassItem[];
  courses: Course[];
  assignments: CourseAssignment[];
  hierarchy: HierarchyConfig;
  schedules: LessonSchedule[];
}

const KEY = "questlms.lms.v3";

const PALETTE = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-primary to-secondary",
  "from-secondary to-accent",
];

const SEED_CLASSES: ClassItem[] = [
  { id: "psych", title: "Cognitive Psychology", code: "PSY-201", students: 38, nextSession: "Today, 18:00", color: "from-primary to-primary/70", seed: true, lessons: [] },
  { id: "chem", title: "Organic Chemistry II", code: "CHM-302", students: 24, nextSession: "Tomorrow, 10:00", color: "from-secondary to-secondary/70", seed: true, lessons: [] },
  { id: "math", title: "Intro to Calculus", code: "MTH-101", students: 52, nextSession: "Thu, 14:00", color: "from-accent to-accent/70", seed: true, lessons: [] },
  { id: "hist", title: "World History — Modern Era", code: "HST-210", students: 19, nextSession: "Fri, 09:00", color: "from-primary to-secondary", seed: true, lessons: [] },
];

const SEED_COURSES: Course[] = [
  {
    id: "course-intro-psych",
    title: "Introduction to Cognitive Psychology",
    description: "Foundations of perception, memory, and reasoning.",
    subject: "Psychology",
    createdAt: Date.now() - 86400000 * 30,
    lessons: [],
    modules: [
      {
        id: "m1",
        title: "Unit 1 — Foundations",
        lessons: [
          { id: "l1", title: "What is Cognition?", type: "video", durationMin: 12 },
          { id: "l2", title: "Memory Models", type: "reading", durationMin: 20 },
        ],
      },
      {
        id: "m2",
        title: "Unit 2 — Assessment",
        lessons: [{ id: "l3", title: "Quiz: Chapter 1", type: "quiz", durationMin: 10 }],
      },
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
    modules: [],
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
    modules: [],
  },
];

const SEED_ASSIGNMENTS: CourseAssignment[] = [
  { classId: "psych", courseId: "course-intro-psych", assignedAt: Date.now() - 86400000 * 25 },
  { classId: "chem", courseId: "course-org-chem", assignedAt: Date.now() - 86400000 * 15 },
  { classId: "math", courseId: "course-calc-101", assignedAt: Date.now() - 86400000 * 8 },
];

const SEED_HIERARCHY: HierarchyConfig = { coursesEnabled: true, modulesEnabled: true };

function defaultState(): LmsState {
  return {
    classes: SEED_CLASSES,
    courses: SEED_COURSES,
    assignments: SEED_ASSIGNMENTS,
    hierarchy: SEED_HIERARCHY,
  };
}

let memoryState: LmsState = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

function normalize(s: Partial<LmsState>): LmsState {
  return {
    classes: (s.classes ?? SEED_CLASSES).map((c) => ({ ...c, lessons: c.lessons ?? [] })),
    courses: (s.courses ?? SEED_COURSES).map((c) => ({
      ...c,
      lessons: c.lessons ?? [],
      modules: c.modules ?? [],
    })),
    assignments: s.assignments ?? SEED_ASSIGNMENTS,
    hierarchy: { ...SEED_HIERARCHY, ...(s.hierarchy ?? {}) },
  };
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memoryState = normalize(JSON.parse(raw));
  } catch {}
}

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(memoryState)); } catch {}
}

function emit() { listeners.forEach((l) => l()); }

function setState(updater: (s: LmsState) => LmsState) {
  memoryState = updater(memoryState);
  persist();
  emit();
}

export function useLms() {
  const state = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => memoryState,
    () => memoryState,
  );
  useEffect(() => { if (!hydrated) { load(); emit(); } }, []);
  return state;
}

// --- Hierarchy ---
export function setHierarchy(patch: Partial<HierarchyConfig>) {
  setState((s) => ({ ...s, hierarchy: { ...s.hierarchy, ...patch } }));
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
    lessons: [],
  };
  setState((s) => ({ ...s, classes: [item, ...s.classes] }));
  return item;
}

export function addClassLesson(classId: string, input: { title: string; type: LessonType; durationMin?: number }) {
  const lesson: Lesson = { id: `lsn-${Date.now()}`, ...input };
  setState((s) => ({
    ...s,
    classes: s.classes.map((c) => c.id === classId ? { ...c, lessons: [...c.lessons, lesson] } : c),
  }));
  return lesson;
}

export function deleteClassLesson(classId: string, lessonId: string) {
  setState((s) => ({
    ...s,
    classes: s.classes.map((c) => c.id === classId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c),
  }));
}

// --- Course actions ---
export function createCourse(input: { title: string; description?: string; subject?: string }) {
  const item: Course = {
    id: `crs-${Date.now()}`,
    title: input.title,
    description: input.description,
    subject: input.subject,
    lessons: [],
    modules: [],
    createdAt: Date.now(),
  };
  setState((s) => ({ ...s, courses: [item, ...s.courses] }));
  return item;
}

export function addLesson(
  courseId: string,
  input: { title: string; type: LessonType; durationMin?: number; moduleId?: string },
) {
  const lesson: Lesson = {
    id: `lsn-${Date.now()}`,
    title: input.title,
    type: input.type,
    durationMin: input.durationMin,
  };
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) => {
      if (c.id !== courseId) return c;
      if (input.moduleId) {
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === input.moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m,
          ),
        };
      }
      return { ...c, lessons: [...c.lessons, lesson] };
    }),
  }));
  return lesson;
}

export function deleteLesson(courseId: string, lessonId: string, moduleId?: string) {
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) => {
      if (c.id !== courseId) return c;
      if (moduleId) {
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
          ),
        };
      }
      return { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) };
    }),
  }));
}

export function addModule(courseId: string, title: string) {
  const mod: Module = { id: `mod-${Date.now()}`, title, lessons: [] };
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) => c.id === courseId ? { ...c, modules: [...c.modules, mod] } : c),
  }));
  return mod;
}

export function deleteModule(courseId: string, moduleId: string) {
  setState((s) => ({
    ...s,
    courses: s.courses.map((c) => c.id === courseId ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) } : c),
  }));
}

export function courseLessonCount(c: Course) {
  return c.lessons.length + c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

// --- Assignment actions ---
export function assignCourse(classId: string, courseId: string) {
  setState((s) => {
    if (s.assignments.some((a) => a.classId === classId && a.courseId === courseId)) return s;
    return { ...s, assignments: [...s.assignments, { classId, courseId, assignedAt: Date.now() }] };
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
