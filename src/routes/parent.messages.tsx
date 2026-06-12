import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentMessages } from "@/lib/parent-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/parent/messages")({
  head: () => ({ meta: [{ title: i18n.t("parentMessages.meta.title") }] }),
  component: ParentMessagesPage,
});

function ParentMessagesPage() {
  const { t, i18n: i18next } = useTranslation();
  const messagesQuery = useParentMessages();
  const items = messagesQuery.data ?? [];

  const formatDateTime = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(i18next.language, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <DashboardShell>
      <TopBar title={t("parentMessages.topbar.title")} subtitle={t("parentMessages.topbar.subtitle")} showStreak={false} />

      {messagesQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => <div key={index} className="h-28 rounded-3xl border-2 border-border bg-card animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <p className="font-black">{t("parentMessages.empty.title")}</p>
          <p className="text-sm text-foreground/60 mt-2">{t("parentMessages.empty.body")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const ownerRoleLabel = t("parentMessages.ownerRole." + item.ownerRole, { defaultValue: item.ownerRole });
            const priorityLabel = t("parentMessages.priority." + item.priority, { defaultValue: item.priority });
            const statusLabel = t("parentMessages.status." + item.status, { defaultValue: item.status });

            return (
              <article key={`${item.studentId}-${item.id}`} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-black text-base">{item.studentName}</p>
                    <p className="text-xs text-foreground/55 font-medium mt-1">
                      {item.category} · {ownerRoleLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className="rounded-md bg-muted px-2 py-1 text-foreground/60">{priorityLabel}</span>
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{statusLabel}</span>
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground/80">{item.message}</p>

                <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-foreground/55 font-medium">
                  <span>{t("parentMessages.updated", { date: formatDateTime(item.updatedAt) })}</span>
                  <span>{item.dueAt ? t("parentMessages.due", { date: formatDateTime(item.dueAt) }) : t("parentMessages.noDueDate")}</span>
                </div>
              </article>
            );
          })}

          <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow flex items-start gap-3 text-sm text-foreground/60">
            <Inbox className="size-4 mt-0.5 text-foreground/40" />
            <p>{t("parentMessages.backendNotice")}</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
