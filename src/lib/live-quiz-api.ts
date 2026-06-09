import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";

export type LiveQuizStatus = "waiting" | "question" | "reveal" | "finished";

export type LiveQuizQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
};

export type LiveQuizStateResponse = {
  status: LiveQuizStatus;
  pin: string;
  title: string;
  playerCount: number;
  players: Array<{ nickname: string; score: number }>;
  currentQuestionIndex: number;
  totalQuestions: number;
  question?: { text: string; options: string[]; timeLeft: number };
  answerCounts?: number[];
  correctIndex?: number;
  leaderboard?: Array<{ nickname: string; score: number }>;
};

export type CreateLiveQuizPayload = {
  title: string;
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
  }>;
  secondsPerQuestion?: number;
  courseId?: number;
};

export function useCreateLiveQuiz() {
  return useMutation({
    mutationFn: (payload: CreateLiveQuizPayload) =>
      apiRequest<{ pin: string }>("/live-quizzes", { body: payload }),
  });
}

export function useLiveQuizState(pin: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["live-quiz-state", pin],
    queryFn: () => apiRequest<LiveQuizStateResponse>(`/live-quizzes/${pin}/state`),
    enabled: enabled && pin !== null,
    refetchInterval: 1500,
    staleTime: 0,
  });
}

export function useJoinLiveQuiz() {
  return useMutation({
    mutationFn: ({ pin, nickname }: { pin: string; nickname: string }) =>
      apiRequest<{ playerId: string; nickname: string }>(`/live-quizzes/${pin}/join`, {
        body: { nickname },
      }),
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({
      pin,
      playerId,
      selectedIndex,
    }: {
      pin: string;
      playerId: string;
      selectedIndex: number;
    }) =>
      apiRequest<{ correct: boolean; score: number; totalScore: number }>(
        `/live-quizzes/${pin}/answer`,
        { body: { playerId, selectedIndex } },
      ),
  });
}

export function useNextQuestion() {
  return useMutation({
    mutationFn: (pin: string) =>
      apiRequest<{ status: LiveQuizStatus; questionIndex: number }>(
        `/live-quizzes/${pin}/next`,
        { method: "POST" },
      ),
  });
}

export function useRevealAnswer() {
  return useMutation({
    mutationFn: (pin: string) =>
      apiRequest<{ correctIndex: number }>(`/live-quizzes/${pin}/reveal`, { method: "POST" }),
  });
}

export function useEndQuiz() {
  return useMutation({
    mutationFn: (pin: string) =>
      apiRequest<{ success: boolean }>(`/live-quizzes/${pin}`, { method: "DELETE" }),
  });
}

export type LiveQuizResultsResponse = {
  pin: string;
  title: string;
  playerCount: number;
  avgScore: number;
  topScore: number;
  leaderboard: Array<{ rank: number; nickname: string; score: number }>;
  questions: Array<{
    index: number;
    text: string;
    options: string[];
    correctIndex: number;
    answerCounts: number[];
    correctPercent: number;
    totalAnswered: number;
  }>;
};

export type LiveQuizAiQuestion = {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export function useGenerateLiveQuizDraft() {
  return useMutation({
    mutationFn: (dto: { topic: string; questionCount: number; language?: string }) =>
      apiRequest<{ questions: LiveQuizAiQuestion[] }>("/ai-lms/live-quiz-draft", { body: dto }),
  });
}

export function useLiveQuizResults(pin: string) {
  return useQuery({
    queryKey: ["live-quiz-results", pin],
    queryFn: () => apiRequest<LiveQuizResultsResponse>(`/live-quizzes/${pin}/results`),
    enabled: !!pin,
    staleTime: 60_000,
  });
}
