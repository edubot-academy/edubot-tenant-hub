// Mock "AI" helpers for the prototype. Pure functions — easy to swap for
// real model calls later (Lovable AI Gateway) without touching the UI.

import type { Course, Lesson, LessonType, Module } from "./lmsStore";

export interface DraftLesson {
  title: string;
  type: LessonType;
  durationMin: number;
}

export interface DraftModule {
  title: string;
  lessons: DraftLesson[];
}

export interface CurriculumDraft {
  modules: DraftModule[];
  totalLessons: number;
  perWeek: number;
}

// Split curriculum text into a structured outline.
// Heuristics:
//  - Lines starting with "Unit", "Module", "Chapter", "Week" or markdown "# " → module headings
//  - Numbered/bulleted items become lessons under the current module
//  - Trailing keywords ("quiz", "test", "assignment", "lab", "video", "reading") infer type
export function parseCurriculum(text: string): CurriculumDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const modules: DraftModule[] = [];
  let current: DraftModule | null = null;

  const moduleRe = /^(#{1,3}\s+|unit\b|module\b|chapter\b|week\b|part\b|section\b)/i;
  const bulletRe = /^(\d+[\.\)]\s+|[-*•]\s+)/;

  for (const raw of lines) {
    const line = raw.replace(/^[#>\s]+/, "").trim();
    if (!line) continue;

    if (moduleRe.test(raw)) {
      current = { title: line.replace(/^[#>\s]+/, "").slice(0, 120), lessons: [] };
      modules.push(current);
      continue;
    }

    const cleaned = line.replace(bulletRe, "").trim();
    if (!cleaned) continue;
    if (!current) {
      current = { title: "Introduction", lessons: [] };
      modules.push(current);
    }
    current.lessons.push({
      title: cleaned.slice(0, 140),
      type: inferType(cleaned),
      durationMin: inferDuration(cleaned),
    });
  }

  // Ensure at least one lesson per module (drop empty modules)
  const trimmed = modules.filter((m) => m.lessons.length > 0);
  const totalLessons = trimmed.reduce((s, m) => s + m.lessons.length, 0);
  return { modules: trimmed, totalLessons, perWeek: 0 };
}

function inferType(s: string): LessonType {
  const l = s.toLowerCase();
  if (/\b(quiz|exam|test)\b/.test(l)) return "quiz";
  if (/\b(assignment|homework|project|lab|practice|exercise)\b/.test(l)) return "assignment";
  if (/\b(live|seminar|workshop|lecture session|class meeting)\b/.test(l)) return "live";
  if (/\b(read|reading|chapter|article|notes)\b/.test(l)) return "reading";
  return "video";
}

function inferDuration(s: string): number {
  const m = s.match(/(\d{1,3})\s*(min|m\b)/i);
  if (m) return Math.min(180, Math.max(5, parseInt(m[1], 10)));
  const type = inferType(s);
  if (type === "quiz") return 15;
  if (type === "assignment") return 45;
  if (type === "live") return 60;
  if (type === "reading") return 25;
  return 15;
}

// Spread lessons evenly across [start, end].
// Returns an ISO date per lesson, in the same order as a flat traversal of modules.
export function distributeOverTimeframe(
  draft: CurriculumDraft,
  startISO: string,
  endISO: string,
): string[] {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const n = Math.max(1, draft.totalLessons);
  const span = Math.max(0, end - start);
  const step = n > 1 ? span / (n - 1) : 0;
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(new Date(start + step * i).toISOString());
  return out;
}

// --- Placement test generation ---

export interface DraftQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  // 0-based difficulty bucket; higher = later lesson in the course
  bucket: number;
}

export interface PlacementBlueprint {
  questions: DraftQuestion[];
  bucketToLessonId: Record<number, string>; // suggested start lesson per bucket score
}

// Build a placement test from a course's lessons. Creates one MCQ per
// bucket (~5 buckets max), each derived from a lesson title.
export function generatePlacementTest(course: Course): PlacementBlueprint {
  const flat = flattenLessons(course);
  if (flat.length === 0) {
    return { questions: [], bucketToLessonId: {} };
  }
  const bucketCount = Math.min(5, Math.max(2, Math.ceil(flat.length / 2)));
  const questions: DraftQuestion[] = [];
  const bucketToLessonId: Record<number, string> = {};

  for (let b = 0; b < bucketCount; b++) {
    const lessonIdx = Math.min(flat.length - 1, Math.floor((b / bucketCount) * flat.length));
    const lesson = flat[lessonIdx];
    bucketToLessonId[b] = lesson.id;

    const correct = lesson.title;
    const distractors = pickDistractors(flat, lessonIdx, 3);
    const options = shuffle([correct, ...distractors]);
    questions.push({
      id: `q-${b}-${Date.now()}`,
      prompt: `Which topic best matches "${summarize(lesson.title)}"?`,
      options,
      correctIndex: options.indexOf(correct),
      bucket: b,
    });
  }
  return { questions, bucketToLessonId };
}

function summarize(s: string): string {
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

function pickDistractors(all: Lesson[], skip: number, n: number): string[] {
  const pool = all.filter((_, i) => i !== skip).map((l) => l.title);
  const out: string[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  while (out.length < n) out.push(`Unrelated topic ${out.length + 1}`);
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function flattenLessons(course: Course): Lesson[] {
  const out: Lesson[] = [];
  for (const m of course.modules) for (const l of m.lessons) out.push(l);
  for (const l of course.lessons) out.push(l);
  return out;
}

// Map a placement score (number of correct answers) to a suggested start lesson.
export function scoreToStartLesson(
  bp: { bucketToLessonId: Record<number, string> },
  correctCount: number,
  totalQuestions: number,
): string | undefined {
  if (totalQuestions === 0) return undefined;
  const ratio = correctCount / totalQuestions;
  const buckets = Object.keys(bp.bucketToLessonId).map(Number).sort((a, b) => a - b);
  if (buckets.length === 0) return undefined;
  const idx = Math.min(buckets.length - 1, Math.floor(ratio * buckets.length));
  return bp.bucketToLessonId[buckets[idx]];
}

// Convert a parsed curriculum into the shape the LMS store understands.
export function draftToCourseContent(
  draft: CurriculumDraft,
): { modules: Pick<Module, "title" | "lessons">[]; ungrouped: Lesson[] } {
  const modules = draft.modules.map((m) => ({
    title: m.title,
    lessons: m.lessons.map((l) => ({
      id: `lsn-${Math.random().toString(36).slice(2, 9)}`,
      title: l.title,
      type: l.type,
      durationMin: l.durationMin,
    })),
  }));
  return { modules, ungrouped: [] };
}
