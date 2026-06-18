import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type StudentNote = {
  id: number;
  kind: "note" | "highlight" | "bookmark";
  body: string;
  courseId: number | null;
  lessonId: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotePayload = {
  kind: "note" | "highlight" | "bookmark";
  body: string;
  courseId?: number | null;
  lessonId?: number | null;
  color?: string | null;
};

export type UpdateNotePayload = Partial<Omit<CreateNotePayload, "kind">>;

const NOTES_KEY = ["student-notes"] as const;

export function useStudentNotes(filter?: { kind?: string; courseId?: number }) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: [...NOTES_KEY, filter],
    queryFn: () =>
      apiRequest<StudentNote[]>("/student/notes", {
        params: {
          ...(filter?.kind ? { kind: filter.kind } : {}),
          ...(filter?.courseId ? { courseId: filter.courseId } : {}),
        },
      }),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useCreateStudentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotePayload) =>
      apiRequest<StudentNote>("/student/notes", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useUpdateStudentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateNotePayload) =>
      apiRequest<StudentNote>(`/student/notes/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useDeleteStudentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/student/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}
