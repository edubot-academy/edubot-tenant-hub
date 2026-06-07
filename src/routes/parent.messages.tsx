import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentMessages } from "@/lib/parent-portal-api";

export const Route = createFileRoute("/parent/messages")({
  head: () => ({ meta: [{ title: "QuestLMS — Messages" }] }),
  component: ParentMessagesPage,
});

function ParentMessagesPage() {
  const messagesQuery = useParentMessages();
  const items = messagesQuery.data ?? [];

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Support and school communication across linked children." showStreak={false} />

      {messagesQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => <div key={index} className="h-28 rounded-3xl border-2 border-border bg-card animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <p className="font-black">No parent messages yet</p>
          <p className="text-sm text-foreground/60 mt-2">Linked-child support and school communication will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={`${item.studentId}-${item.id}`} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-black text-base">{item.studentName}</p>
                  <p className="text-xs text-foreground/55 font-medium mt-1">
                    {item.category} · {item.ownerRole}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground/60">{item.priority}</span>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{item.status}</span>
                </div>
              </div>

              <p className="text-sm font-medium text-foreground/80">{item.message}</p>

              <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-foreground/55 font-medium">
                <span>Updated {formatDateTime(item.updatedAt)}</span>
                <span>{item.dueAt ? `Due ${formatDateTime(item.dueAt)}` : "No due date"}</span>
              </div>
            </article>
          ))}

          <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow flex items-start gap-3 text-sm text-foreground/60">
            <Inbox className="size-4 mt-0.5 text-foreground/40" />
            <p>
              Direct parent reply is not wired yet. This screen shows the real linked-child support/message queue instead of a prototype chat composer.
            </p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
