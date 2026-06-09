import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Building2, Users, BookOpen, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useMyAnnouncements,
  useMarkAnnouncementRead,
  type AnnouncementRecord,
} from "@/lib/announcements-api";

export const Route = createFileRoute("/student/announcements")({
  head: () => ({ meta: [{ title: "QuestLMS — Announcements" }] }),
  component: StudentAnnouncementsPage,
});

function StudentAnnouncementsPage() {
  const { context } = useAppContext();

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="Announcements" subtitle="Updates from your instructors" />
        <section className="rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center">
          <Megaphone className="mx-auto size-10 text-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="font-black">No announcements yet</p>
          <p className="text-sm font-medium text-foreground/50 mt-1">Your instructors haven't posted anything yet.</p>
        </section>
      </DashboardShell>
    );
  }

  return <BackendStudentAnnouncementsPage />;
}

function BackendStudentAnnouncementsPage() {
  const listQuery = useMyAnnouncements();
  const markRead = useMarkAnnouncementRead();

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const items = listQuery.data ?? [];
  const unreadCount = items.filter((a) => !a.isRead).length;

  return (
    <DashboardShell>
      <TopBar
        title="Announcements"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      />

      {listQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-3xl border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center">
          <Megaphone className="mx-auto size-10 text-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="font-black">No announcements yet</p>
          <p className="text-sm font-medium text-foreground/50 mt-1">
            Your instructors haven't posted anything yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <StudentAnnouncementCard
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead}
              marking={markRead.isPending && markRead.variables === item.id}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function StudentAnnouncementCard({
  item,
  onMarkRead,
  marking,
}: {
  item: AnnouncementRecord & { isRead?: boolean; authorName?: string | null };
  onMarkRead: (id: number) => void;
  marking: boolean;
}) {
  const ScopeIcon =
    item.scopeType === "company" ? Building2 : item.scopeType === "group" ? Users : BookOpen;

  const scopeLabel =
    item.scopeType === "company" ? "All students" : item.scopeType === "group" ? "Group" : "Class";

  return (
    <article
      className={`rounded-3xl border-2 bg-card p-5 chunky-shadow space-y-3 transition-colors ${
        item.isRead ? "border-border opacity-75" : "border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`rounded-xl p-1.5 shrink-0 ${item.isRead ? "bg-muted text-foreground/40" : "bg-primary/10 text-primary"}`}>
            <Megaphone className="size-4" />
          </span>
          <div className="min-w-0">
            <p className={`font-black truncate ${item.isRead ? "text-foreground/60" : ""}`}>{item.title}</p>
            {item.authorName && (
              <p className="text-[11px] text-foreground/40 font-medium">{item.authorName}</p>
            )}
          </div>
        </div>

        {!item.isRead && (
          <button
            onClick={() => onMarkRead(item.id)}
            disabled={marking}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border text-[11px] font-black hover:bg-muted disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" strokeWidth={2.5} />
            Mark read
          </button>
        )}
      </div>

      <p className="text-sm font-medium text-foreground/70 leading-relaxed">{item.body}</p>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-foreground/40">
        <span className="inline-flex items-center gap-1">
          <ScopeIcon className="size-3" />
          {scopeLabel}
        </span>
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        {item.isRead && (
          <span className="inline-flex items-center gap-1 text-green-600">
            <CheckCheck className="size-3" strokeWidth={2.5} /> Read
          </span>
        )}
      </div>
    </article>
  );
}
