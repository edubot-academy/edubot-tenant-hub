import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type QuizTemplateRecord = {
  id: number;
  authorId: number;
  authorName: string | null;
  title: string;
  content: string;
  courseName: string | null;
  questionCount: number;
  usesCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

const QK = "quiz-templates";

export function useQuizTemplates() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: [QK],
    queryFn: () => apiRequest<QuizTemplateRecord[]>("/quiz-templates"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useCreateQuizTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; content: string; courseName?: string; questionCount?: number }) =>
      apiRequest<QuizTemplateRecord>("/quiz-templates", { method: "POST", body: dto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeleteQuizTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/quiz-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDuplicateQuizTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<QuizTemplateRecord>(`/quiz-templates/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useRecordQuizTemplateUse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/quiz-templates/${id}/use`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
