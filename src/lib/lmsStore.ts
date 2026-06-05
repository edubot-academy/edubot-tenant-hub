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

export type GroupScheduleMode = "inherit" | "distribute" | "offset";

// Group-level schedule (currently scoped to a course assigned to a class).
// Used to derive per-lesson effective schedule via inheritance.
export interface GroupSchedule {
  classId: string;
  courseId: string;
  mode: GroupScheduleMode;
  startAt?: string; // ISO — required for all modes
  endAt?: string;   // ISO — used by `distribute`
  dueAt?: string;   // ISO — used by `inherit` for assignments/quizzes
  // For `offset` mode: per-lesson day offset from startAt
  lessonOffsets?: Record<string, number>;
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
    schedules: [],
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
    schedules: s.schedules ?? [],
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

// --- Schedule actions ---
export interface ScheduledLesson {
  lesson: Lesson;
  source: "course" | "class";
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  schedule?: LessonSchedule;
}

export function setSchedule(classId: string, lessonId: string, patch: { startAt?: string | null; dueAt?: string | null }) {
  setState((s) => {
    const idx = s.schedules.findIndex((x) => x.classId === classId && x.lessonId === lessonId);
    const existing = idx >= 0 ? s.schedules[idx] : { classId, lessonId };
    const next: LessonSchedule = {
      classId,
      lessonId,
      startAt: patch.startAt === null ? undefined : patch.startAt ?? existing.startAt,
      dueAt: patch.dueAt === null ? undefined : patch.dueAt ?? existing.dueAt,
    };
    // If both empty, remove the entry
    if (!next.startAt && !next.dueAt) {
      return { ...s, schedules: s.schedules.filter((_, i) => i !== idx) };
    }
    if (idx >= 0) {
      const copy = s.schedules.slice();
      copy[idx] = next;
      return { ...s, schedules: copy };
    }
    return { ...s, schedules: [...s.schedules, next] };
  });
}

export function clearSchedule(classId: string, lessonId: string) {
  setState((s) => ({
    ...s,
    schedules: s.schedules.filter((x) => !(x.classId === classId && x.lessonId === lessonId)),
  }));
}

export function getSchedule(state: LmsState, classId: string, lessonId: string) {
  return state.schedules.find((x) => x.classId === classId && x.lessonId === lessonId);
}

export function lessonsForClass(state: LmsState, classId: string): ScheduledLesson[] {
  const out: ScheduledLesson[] = [];
  const klass = state.classes.find((c) => c.id === classId);
  if (!klass) return out;

  if (state.hierarchy.coursesEnabled) {
    const courses = coursesForClass(state, classId);
    for (const course of courses) {
      for (const m of course.modules) {
        for (const l of m.lessons) {
          out.push({
            lesson: l,
            source: "course",
            courseId: course.id,
            courseTitle: course.title,
            moduleId: m.id,
            moduleTitle: m.title,
            schedule: getSchedule(state, classId, l.id),
          });
        }
      }
      for (const l of course.lessons) {
        out.push({
          lesson: l,
          source: "course",
          courseId: course.id,
          courseTitle: course.title,
          schedule: getSchedule(state, classId, l.id),
        });
      }
    }
  }
  for (const l of klass.lessons) {
    out.push({
      lesson: l,
      source: "class",
      schedule: getSchedule(state, classId, l.id),
    });
  }
  return out;
}
