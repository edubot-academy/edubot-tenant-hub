import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type LeaderboardEntry = {
  studentId: number;
  fullName: string;
  avatarUrl: string | null;
  xp: number;
  progressPercent?: number;
  lessonsCompleted?: number;
  quizzesPassed?: number;
  lastActivityAt?: string | null;
  streakDays?: number;
};

export type LeaderboardResponse = {
  items: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
};

export type LeaderboardSummary = {
  rank: number | null;
  previousRank: number | null;
  rankDelta: number | null;
  xp: number;
  windowXp: number;
  streakDays: number;
  percentile: number | null;
  strongestSkill: { slug: string; name: string; xp: number; progressPercent: number } | null;
  nextTarget: { rank: number; xp: number; xpGap: number; label: string } | null;
};

export function useWeeklyLeaderboard(page = 1, limit = 20) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend";

  return useQuery({
    queryKey: ["leaderboard", "weekly", page, limit],
    queryFn: () =>
      apiRequest<LeaderboardResponse>("/leaderboard/weekly", {
        params: { page, limit },
      }),
    enabled,
    staleTime: 60_000,
  });
}

export function useLeaderboardMe() {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend";

  return useQuery({
    queryKey: ["leaderboard", "me"],
    queryFn: () => apiRequest<LeaderboardSummary>("/leaderboard/me"),
    enabled,
    staleTime: 60_000,
  });
}
