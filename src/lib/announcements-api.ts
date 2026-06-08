import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type AnnouncementRecord = {
  id: number;
  authorId: number;
  title: string;
  body: string;
  scopeType: "class" | "group" | "company";
  scopeId: number | null;
  createdAt: string;
};

export type CreateAnnouncementPayload = {
  title: string;
  body: string;
  scopeType: "class" | "group" | "company";
  scopeId?: number | null;
};

const ANNOUNCEMENTS_KEY = ["announcements"] as const;

export function useAnnouncements() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ANNOUNCEMENTS_KEY,
    queryFn: () => apiRequest<AnnouncementRecord[]>("/announcements"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useMyAnnouncements() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["announcements", "my"],
    queryFn: () => apiRequest<AnnouncementRecord[]>("/announcements/my"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      apiRequest<AnnouncementRecord>("/announcements", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
    },
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/announcements/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements", "my"] });
    },
  });
}
