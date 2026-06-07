import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type InAppNotification = {
  id: number;
  userId: number;
  companyId: number | null;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationListResponse = {
  items: InAppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function notificationListQueryKey(page: number, limit: number) {
  return ["notifications", page, limit] as const;
}

function notificationUnreadQueryKey() {
  return ["notifications", "unread-count"] as const;
}

export function useNotifications(page = 1, limit = 50) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend";

  return useQuery({
    queryKey: notificationListQueryKey(page, limit),
    queryFn: () => apiRequest<NotificationListResponse>("/notifications", { params: { page, limit } }),
    enabled,
  });
}

export function useNotificationUnreadCount() {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend";

  return useQuery({
    queryKey: notificationUnreadQueryKey(),
    queryFn: () => apiRequest<{ count: number }>("/notifications/unread-count"),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok?: boolean; messageKey?: string }>(`/notifications/${id}/read`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: notificationUnreadQueryKey() }),
      ]);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ ok?: boolean; messageKey?: string }>("/notifications/read-all", {
        method: "POST",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: notificationUnreadQueryKey() }),
      ]);
    },
  });
}
