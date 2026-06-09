import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type AiChat = {
  id: number;
  courseId: number;
  title: string | null;
  status: "active" | "archived" | "deleted";
  language: string;
  messagesCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type AiMessage = {
  id: number;
  chatId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export function useAiChats(courseId: number | null) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["ai-chats", courseId],
    queryFn: () => apiRequest<AiChat[]>(`/courses/${courseId}/ai/chats`),
    enabled: isBackendApiEnabled() && context.mode === "backend" && courseId !== null,
  });
}

export function useAiMessages(chatId: number | null) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["ai-messages", chatId],
    queryFn: () => apiRequest<AiMessage[]>(`/ai/chats/${chatId}/messages`),
    enabled: isBackendApiEnabled() && context.mode === "backend" && chatId !== null,
    staleTime: Infinity,
  });
}

export function useCreateAiChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, title, lessonId }: { courseId: number; title?: string; lessonId?: number }) =>
      apiRequest<AiChat & { lessonTitle: string | null; messageKey: string }>(`/courses/${courseId}/ai/chats`, {
        body: { title, lessonId },
      }),
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: ["ai-chats", courseId] });
    },
  });
}

export function useSendAiMessage() {
  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: number; content: string }) =>
      apiRequest<{ message: AiMessage; suggestions: string[]; messageKey: string }>(
        `/ai/chats/${chatId}/messages`,
        { body: { content } },
      ),
  });
}

export function useDeleteAiChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId }: { chatId: number }) =>
      apiRequest<{ success: boolean }>(`/ai/chats/${chatId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-chats"] });
    },
  });
}

// ─── Free-form content generation (AI Generator page) ─────────────────────────

export type FreeFormMode = "quiz" | "summary" | "outline";

export type FreeFormResult = {
  content: string;
  mode: FreeFormMode;
  topic: string;
  messageKey: string;
};

export type StudyPlanBlock = {
  day: string;
  focus: string;
  tasks: { label: string; mins: number }[];
};

export type SavedStudyPlanTask = { id: string; label: string; mins: number; done: boolean };
export type SavedStudyPlanBlock = { day: string; focus: string; tasks: SavedStudyPlanTask[] };
export type SavedStudyPlan = {
  id: number;
  goal: string;
  weeks: number;
  minsPerDay: number;
  days: number;
  strengths?: string | null;
  weaknesses?: string | null;
  blocks: SavedStudyPlanBlock[];
  createdAt: string;
  updatedAt: string;
};

export function useActiveStudyPlan() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["study-plan-active"],
    queryFn: () => apiRequest<SavedStudyPlan | null>("/study-plans/active"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    staleTime: 60_000,
  });
}

export function useSaveStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      goal: string; weeks: number; minsPerDay: number; days: number;
      strengths?: string; weaknesses?: string; blocks: SavedStudyPlanBlock[];
    }) => apiRequest<SavedStudyPlan>("/study-plans", { body: payload }),
    onSuccess: (data) => {
      qc.setQueryData(["study-plan-active"], data);
    },
  });
}

export function useUpdateStudyPlanProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocks }: { id: number; blocks: SavedStudyPlanBlock[] }) =>
      apiRequest<SavedStudyPlan>(`/study-plans/${id}/progress`, { method: "PATCH", body: { blocks } }),
    onSuccess: (data) => {
      qc.setQueryData(["study-plan-active"], data);
    },
  });
}

export function useGenerateStudyPlan() {
  return useMutation({
    mutationFn: (payload: {
      goal: string;
      weeks: number;
      minsPerDay: number;
      strengths?: string;
      weaknesses?: string;
      courseTitle?: string;
    }) => apiRequest<{ blocks: StudyPlanBlock[]; days: number }>("/ai/study-plan", { body: payload }),
  });
}

export function useGenerateFreeFormContent() {
  return useMutation({
    mutationFn: (payload: {
      mode: FreeFormMode;
      topic: string;
      level?: string;
      questionCount?: number;
      language?: string;
    }) =>
      apiRequest<FreeFormResult>("/ai-lms/free-form", { body: payload }),
  });
}
