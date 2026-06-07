import { createFileRoute } from "@tanstack/react-router";
import { Bell, BookOpen, CheckCheck, MessageSquare, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationUnreadCount,
  type InAppNotification,
} from "@/lib/notifications-api";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "QuestLMS — Notifications" }] }),
  component: NotificationsPage,
});

type NotificationTab = "All" | "Unread" | "Messages" | "Courses" | "Alerts";

const tabs: readonly NotificationTab[] = ["All", "Unread", "Messages", "Courses", "Alerts"];

function NotificationsPage() {
  const { context } = useAppContext();
  const [tab, setTab] = useState<NotificationTab>("All");
  const notificationsQuery = useNotifications();
  const unreadQuery = useNotificationUnreadCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const items = notificationsQuery.data?.items ?? [];
  const unread = unreadQuery.data?.count ?? items.filter((item) => !item.isRead).length;
  const filtered = useMemo(() => {
    return items.filter((item) => matchesTab(item, tab));
  }, [items, tab]);

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="Notifications" subtitle="Prototype inbox" />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses local demo notifications.
        </section>
      </DashboardShell>
    );
  }

  const markRead = async (notification: InAppNotification) => {
    if (notification.isRead) return;
    try {
      await markReadMutation.mutateAsync(notification.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update notification");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark notifications as read");
    }
  };

  return (
    <DashboardShell>
      <TopBar title="Notifications" subtitle={`${unread} unread`} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-x-auto rounded-2xl border-2 border-border bg-card p-1 chunky-shadow">
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${
                tab === value ? "bg-foreground text-background" : "text-foreground/60"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={markAllReadMutation.isPending || unread === 0}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold chunky-shadow disabled:opacity-60"
          >
            <CheckCheck className="size-4" /> Mark all read
          </button>
          <button type="button" className="grid size-10 place-items-center rounded-xl border-2 border-border bg-card chunky-shadow" aria-label="settings">
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border-2 border-border bg-card chunky-shadow divide-y-2 divide-border">
        {notificationsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((index) => <div key={index} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : notificationsQuery.isError ? (
          <div className="p-10 text-center">
            <Bell className="mx-auto mb-3 size-10 text-destructive/50" />
            <p className="font-black text-destructive">Could not load notifications</p>
            <p className="text-sm font-medium text-foreground/60">Backend mode is enabled, but the notification request failed.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="mx-auto mb-3 size-10 text-foreground/30" />
            <p className="font-black">You're all caught up</p>
            <p className="text-sm font-medium text-foreground/60">Nothing in this view right now.</p>
          </div>
        ) : (
          filtered.map((notification) => {
            const Icon = notificationTypeIcon(notification.type);
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead(notification)}
                className={`flex w-full cursor-pointer gap-4 p-4 text-left transition-colors hover:bg-muted/40 ${!notification.isRead ? "bg-primary/5" : ""}`}
              >
                <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${notificationTypeTone(notification.type)}`}>
                  <Icon className="size-5" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black">{notification.title}</p>
                    {!notification.isRead ? <span className="size-2 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground/70">{notification.body}</p>
                </div>
                <span className="mt-0.5 whitespace-nowrap text-xs font-bold text-foreground/40">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </section>
    </DashboardShell>
  );
}

function matchesTab(notification: InAppNotification, tab: NotificationTab): boolean {
  if (tab === "All") return true;
  if (tab === "Unread") return !notification.isRead;
  if (tab === "Messages") return notification.type.includes("message") || notification.type.includes("support");
  if (tab === "Courses") return notification.type.includes("course") || notification.type.includes("progress") || notification.type.includes("lesson");
  if (tab === "Alerts") return !matchesTab(notification, "Messages") && !matchesTab(notification, "Courses");
  return true;
}

function notificationTypeIcon(type: string) {
  if (type.includes("message") || type.includes("support")) return MessageSquare;
  if (type.includes("course") || type.includes("progress") || type.includes("lesson")) return BookOpen;
  return Bell;
}

function notificationTypeTone(type: string) {
  if (type.includes("message") || type.includes("support")) return "bg-secondary/15 text-secondary";
  if (type.includes("course") || type.includes("progress") || type.includes("lesson")) return "bg-primary/15 text-primary";
  return "bg-destructive/15 text-destructive";
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
