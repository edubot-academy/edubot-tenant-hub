import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type DiscussionAuthor = {
  id: number;
  fullName: string | null;
  avatar: string | null;
};

export type DiscussionThread = {
  id: number;
  courseId: number | null;
  groupId: number | null;
  author: DiscussionAuthor;
  title: string;
  body: string;
  isPinned: boolean;
  isResolved: boolean;
  repliesCount: number;
  lastReplyAt: string | null;
  createdAt: string;
};

export type DiscussionReply = {
  id: number;
  threadId: number;
  author: DiscussionAuthor;
  body: string;
  isInstructorAnswer: boolean;
  createdAt: string;
};

export type DiscussionThreadDetail = DiscussionThread & {
  replies: DiscussionReply[];
};

export type CreateThreadPayload = {
  title: string;
  body: string;
  courseId?: number;
  groupId?: number;
};

const THREADS_KEY = ["discussions"] as const;
const threadKey = (id: number) => ["discussions", id] as const;

export function useDiscussionThreads(params?: { courseId?: number; groupId?: number; q?: string; status?: string }) {
  const { context } = useAppContext();
  const search = new URLSearchParams();
  if (params?.courseId) search.set("courseId", String(params.courseId));
  if (params?.groupId) search.set("groupId", String(params.groupId));
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();

  return useQuery({
    queryKey: [...THREADS_KEY, params],
    queryFn: () => apiRequest<DiscussionThread[]>(`/discussions${qs ? `?${qs}` : ""}`),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useDiscussionThread(id: number | null) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: threadKey(id!),
    queryFn: () => apiRequest<DiscussionThreadDetail>(`/discussions/${id}`),
    enabled: isBackendApiEnabled() && context.mode === "backend" && id !== null,
  });
}

export function useCreateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateThreadPayload) =>
      apiRequest<DiscussionThread>("/discussions", { body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: THREADS_KEY }),
  });
}

export function useCreateReply(threadId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiRequest<DiscussionReply>(`/discussions/${threadId}/replies`, { body: { body } }),
    onSuccess: () => {
      if (threadId !== null) qc.invalidateQueries({ queryKey: threadKey(threadId) });
      qc.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function usePatchThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number; isPinned?: boolean; isResolved?: boolean }) =>
      apiRequest<{ ok: boolean }>(`/discussions/${id}`, { method: "PATCH", body: patch }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: threadKey(id) });
      qc.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function useDeleteThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/discussions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: THREADS_KEY }),
  });
}
