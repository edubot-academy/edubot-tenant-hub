import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, ClipboardList, Layers3, UserRoundSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("roles.assistant")}` }] }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { pathname } = useLocation();
  if (pathname === "/assistant") return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AssistantDashboard() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const dashboardQuery = useAssistantDashboard();

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title={t("roles.assistant")} subtitle={t("topbar.subtitleAssistant")} showStreak={false} />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("topbar.subtitleAssistant")}
        </section>
      </DashboardShell>
    );
  }

  const data = dashboardQuery.data;

  return (
    <DashboardShell>
      <TopBar title={t("roles.assistant")} subtitle={t("topbar.subtitleAssistant")} showStreak={false} />

      {dashboardQuery.isLoading && (
        <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("assistantOverview.loading", { defaultValue: "Loading assistant operations…" })}
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          {t("assistantOverview.error", { defaultValue: "Failed to load assistant operations." })}
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <MetricCard label={t("assistantOverview.metrics.activeClasses", { defaultValue: "Active classes" })} value={String(data.operations.activeGroups)} icon={<Layers3 className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.upcomingSessions", { defaultValue: "Upcoming sessions" })} value={String(data.operations.upcomingSessions)} icon={<CalendarClock className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.studentsNeedingSupport", { defaultValue: "Students needing support" })} value={String(data.operations.studentsNeedingSupport)} icon={<UserRoundSearch className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.pendingInvitations", { defaultValue: "Pending invitations" })} value={String(data.operations.pendingInvitations)} icon={<ClipboardList className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.blockedItems", { defaultValue: "Blocked items" })} value={String(data.operations.blockedItems)} icon={<AlertCircle className="size-4" />} />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantOverview.actionQueue.title", { defaultValue: "Action queue" })}</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.actionQueue.subtitle", { defaultValue: "Real operational blockers from the tenant workspace." })}
                  </p>
                </div>
                <Link to="/assistant/discussions" className="text-xs font-black text-primary hover:underline">
                  {t("assistantOverview.actionQueue.openSupport", { defaultValue: "Open support queue" })}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {data.actionQueue.length ? data.actionQueue.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black">{formatActionLabel(item.i18nKey, item.params)}</div>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="mt-2 text-xs font-medium text-foreground/55">
                      {t("assistantOverview.actionQueue.owner", { role: item.ownerRole ?? t("roles.assistant"), defaultValue: "Owner: {{role}}" })}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.actionQueue.empty", { defaultValue: "No assistant blockers are currently open." })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantOverview.supportQueue.title", { defaultValue: "Support queue" })}</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.supportQueue.subtitle", { defaultValue: "Students currently surfaced by support signals." })}
                  </p>
                </div>
                <span className="text-xs font-mono text-foreground/50">{data.studentSupportQueue.length}</span>
              </div>

              <div className="mt-4 space-y-3">
                {data.studentSupportQueue.length ? data.studentSupportQueue.slice(0, 6).map((item) => (
                  <article key={item.studentId} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.fullName ?? item.email ?? t("parentOverview.children.studentFallback", { id: item.studentId })}</p>
                        <p className="mt-1 text-xs font-medium text-foreground/55">
                          {item.groupName ?? item.courseTitle ?? t("app.name")}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {item.supportStatus ?? t("assistantOverview.status.open", { defaultValue: "open" })}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((reason) => (
                        <span key={`${item.studentId}-${reason.code}`} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
                          {reason.code.replaceAll("_", " ")}
                          {reason.count ? ` (${reason.count})` : ""}
                        </span>
                      ))}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.supportQueue.empty", { defaultValue: "No student support cases are currently open." })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <article className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
      <div className="flex items-center gap-2 text-foreground/55">{icon}<span className="text-[10px] font-black uppercase tracking-wider">{label}</span></div>
      <p className="mt-3 text-3xl font-black font-mono">{value}</p>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const { t } = useTranslation();
  const className = priority === "high"
    ? "bg-destructive/15 text-destructive"
    : priority === "medium"
      ? "bg-accent/20 text-accent-foreground"
      : "bg-muted text-foreground/65";

  return (
    <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {t(`assistantOverview.priority.${priority}`, { defaultValue: priority })}
    </span>
  );
}

function formatActionLabel(i18nKey: string, params?: Record<string, string | number | null>) {
  const count = params?.count;
  if (typeof count === "number" || typeof count === "string") {
    return `${i18nKey} (${count})`;
  }
  return i18nKey;
}
