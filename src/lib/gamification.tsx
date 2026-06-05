import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ---------- Types ----------
export type LeagueTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "streak" | "mastery" | "social" | "milestone";
  // criteria for auto-unlock
  unlockAt?: { type: "xp" | "streak" | "lessons" | "quizzes"; value: number };
}

export interface Skill { id: string; name: string; xp: number; max: number }

export interface XpEvent { id: string; kind: string; amount: number; at: number; label: string }

export interface GamificationState {
  xp: number;
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  streak: number;
  longestStreak: number;
  lastActivity: string | null; // YYYY-MM-DD
  league: LeagueTier;
  weeklyXp: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  skills: Skill[];
  unlocked: string[]; // badge ids
  history: XpEvent[];
}

// ---------- Catalog ----------
export const BADGES: Badge[] = [
  { id: "first-step", name: "First step", description: "Complete your first lesson", emoji: "👣", category: "milestone", unlockAt: { type: "lessons", value: 1 } },
  { id: "quiz-rookie", name: "Quiz rookie", description: "Finish your first quiz", emoji: "🎯", category: "milestone", unlockAt: { type: "quizzes", value: 1 } },
  { id: "streak-3", name: "On a roll", description: "3-day streak", emoji: "🔥", category: "streak", unlockAt: { type: "streak", value: 3 } },
  { id: "streak-7", name: "Week warrior", description: "7-day streak", emoji: "⚡", category: "streak", unlockAt: { type: "streak", value: 7 } },
  { id: "streak-30", name: "Unstoppable", description: "30-day streak", emoji: "🏔️", category: "streak", unlockAt: { type: "streak", value: 30 } },
  { id: "xp-1k", name: "Apprentice", description: "Earn 1,000 XP", emoji: "✨", category: "milestone", unlockAt: { type: "xp", value: 1000 } },
  { id: "xp-5k", name: "Adept", description: "Earn 5,000 XP", emoji: "🌟", category: "milestone", unlockAt: { type: "xp", value: 5000 } },
  { id: "xp-10k", name: "Scholar", description: "Earn 10,000 XP", emoji: "🎓", category: "milestone", unlockAt: { type: "xp", value: 10000 } },
  { id: "lessons-10", name: "Curious mind", description: "Complete 10 lessons", emoji: "📚", category: "mastery", unlockAt: { type: "lessons", value: 10 } },
  { id: "lessons-50", name: "Bookworm", description: "Complete 50 lessons", emoji: "📖", category: "mastery", unlockAt: { type: "lessons", value: 50 } },
  { id: "quiz-master", name: "Quiz master", description: "Finish 25 quizzes", emoji: "🧠", category: "mastery", unlockAt: { type: "quizzes", value: 25 } },
  { id: "social-butterfly", name: "Helpful peer", description: "Answer 5 discussions", emoji: "💬", category: "social" },
  { id: "diamond-club", name: "Diamond club", description: "Reach Diamond league", emoji: "💎", category: "milestone" },
  { id: "perfect-week", name: "Perfect week", description: "Earn 500 XP in 7 days", emoji: "🏆", category: "milestone" },
];

export const LEAGUES: Record<LeagueTier, { name: string; emoji: string; min: number; color: string }> = {
  bronze:   { name: "Bronze",   emoji: "🥉", min: 0,    color: "text-amber-700" },
  silver:   { name: "Silver",   emoji: "🥈", min: 200,  color: "text-zinc-500" },
  gold:     { name: "Gold",     emoji: "🥇", min: 500,  color: "text-yellow-500" },
  platinum: { name: "Platinum", emoji: "🛡️", min: 1000, color: "text-cyan-500" },
  diamond:  { name: "Diamond",  emoji: "💎", min: 2000, color: "text-primary" },
};

// XP per action — single source of truth
export const XP_REWARDS = {
  lessonComplete: 50,
  quizComplete: 80,
  quizPerfect: 150,
  dailyLogin: 10,
  discussionPost: 20,
  assignmentSubmit: 120,
} as const;

// Level curve: each level needs L * 200 XP
export function xpForLevel(level: number) { return level * 200; }
export function levelFromXp(xp: number) {
  let lvl = 1, rem = xp;
  while (rem >= xpForLevel(lvl)) { rem -= xpForLevel(lvl); lvl++; }
  return { level: lvl, xpInLevel: rem, xpForNextLevel: xpForLevel(lvl) };
}

export function leagueFromWeeklyXp(weekly: number): LeagueTier {
  const tiers: LeagueTier[] = ["diamond", "platinum", "gold", "silver", "bronze"];
  return tiers.find((t) => weekly >= LEAGUES[t].min) ?? "bronze";
}

// ---------- State ----------
const STORAGE_KEY = "questlms.gamification.v1";
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

const DEFAULT_STATE: Omit<GamificationState, "level" | "xpInLevel" | "xpForNextLevel" | "league"> = {
  xp: 4280,
  streak: 12,
  longestStreak: 18,
  lastActivity: today(),
  weeklyXp: 1340,
  lessonsCompleted: 22,
  quizzesCompleted: 14,
  skills: [
    { id: "memory", name: "Memory", xp: 840, max: 1000 },
    { id: "attention", name: "Attention", xp: 720, max: 1000 },
    { id: "problem", name: "Problem solving", xp: 680, max: 1000 },
    { id: "reading", name: "Reading", xp: 910, max: 1000 },
    { id: "writing", name: "Writing", xp: 760, max: 1000 },
    { id: "numeracy", name: "Numeracy", xp: 640, max: 1000 },
  ],
  unlocked: ["first-step", "quiz-rookie", "streak-3", "streak-7", "xp-1k"],
  history: [
    { id: "h1", kind: "lesson", amount: 50, at: Date.now() - 3600_000, label: "Lesson: Working Memory" },
    { id: "h2", kind: "quiz",   amount: 150, at: Date.now() - 7200_000, label: "Quiz: Phonological Loop · perfect" },
    { id: "h3", kind: "daily",  amount: 10,  at: Date.now() - 86400_000, label: "Daily check-in" },
  ],
};

function derive(s: Omit<GamificationState, "level" | "xpInLevel" | "xpForNextLevel" | "league">): GamificationState {
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(s.xp);
  return { ...s, level, xpInLevel, xpForNextLevel, league: leagueFromWeeklyXp(s.weeklyXp) };
}

interface GamificationCtx {
  state: GamificationState;
  awardXp: (kind: keyof typeof XP_REWARDS | "custom", label: string, custom?: number) => Badge[];
  recordActivity: () => void;
  reset: () => void;
  badges: typeof BADGES;
}

const Ctx = createContext<GamificationCtx | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRaw({ ...DEFAULT_STATE, ...JSON.parse(stored) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined")
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }, [raw, hydrated]);

  const checkUnlocks = useCallback((s: typeof DEFAULT_STATE): Badge[] => {
    const newly: Badge[] = [];
    for (const b of BADGES) {
      if (s.unlocked.includes(b.id) || !b.unlockAt) continue;
      const v = b.unlockAt.value;
      const met =
        (b.unlockAt.type === "xp" && s.xp >= v) ||
        (b.unlockAt.type === "streak" && s.streak >= v) ||
        (b.unlockAt.type === "lessons" && s.lessonsCompleted >= v) ||
        (b.unlockAt.type === "quizzes" && s.quizzesCompleted >= v);
      if (met) newly.push(b);
    }
    return newly;
  }, []);

  const awardXp = useCallback<GamificationCtx["awardXp"]>((kind, label, custom) => {
    let unlocks: Badge[] = [];
    setRaw((s) => {
      const amount = kind === "custom" ? (custom ?? 0) : XP_REWARDS[kind];
      const next = {
        ...s,
        xp: s.xp + amount,
        weeklyXp: s.weeklyXp + amount,
        lessonsCompleted: s.lessonsCompleted + (kind === "lessonComplete" ? 1 : 0),
        quizzesCompleted: s.quizzesCompleted + (kind === "quizComplete" || kind === "quizPerfect" ? 1 : 0),
        history: [{ id: crypto.randomUUID(), kind: String(kind), amount, at: Date.now(), label }, ...s.history].slice(0, 30),
      };
      unlocks = checkUnlocks(next);
      next.unlocked = [...next.unlocked, ...unlocks.map((b) => b.id)];
      return next;
    });
    return unlocks;
  }, [checkUnlocks]);

  const recordActivity = useCallback(() => {
    setRaw((s) => {
      const t = today();
      if (s.lastActivity === t) return s;
      const gap = s.lastActivity ? daysBetween(s.lastActivity, t) : 1;
      const streak = gap === 1 ? s.streak + 1 : 1;
      return {
        ...s,
        streak,
        longestStreak: Math.max(s.longestStreak, streak),
        lastActivity: t,
      };
    });
  }, []);

  const reset = useCallback(() => setRaw(DEFAULT_STATE), []);

  const value = useMemo<GamificationCtx>(() => ({
    state: derive(raw), awardXp, recordActivity, reset, badges: BADGES,
  }), [raw, awardXp, recordActivity, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGamification() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGamification must be used inside GamificationProvider");
  return ctx;
}
