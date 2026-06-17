import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, ClipboardList, Layers3, UserRoundSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import "@/lib/assistant/assistant-i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.assistant.dashboard")}` }] }),
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
          {t("assistantOverview.loading")}
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          {t("assistantOverview.error")}
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <MetricCard label={t("assistantOverview.metrics.activeClasses")} value={String(data.operations.activeGroups)} icon={<Layers3 className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.upcomingSessions")} value={String(data.operations.upcomingSessions)} icon={<CalendarClock className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.studentsNeedingSupport")} value={String(data.operations.studentsNeedingSupport)} icon={<UserRoundSearch className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.pendingInvitations")} value={String(data.operations.pendingInvitations)} icon={<ClipboardList className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.blockedItems")} value={String(data.operations.blockedItems)} icon={<AlertCircle className="size-4" />} />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantOverview.actionQueue.title")}</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.actionQueue.subtitle")}
                  </p>
                </div>
                <Link to="/assistant/discussions" className="text-xs font-black text-primary hover:underline">
                  {t("assistantOverview.actionQueue.openSupport")}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {data.actionQueue.length ? data.actionQueue.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black">{formatActionLabel(t, item.type, item.i18nKey, item.params)}</div>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="mt-2 text-xs font-medium text-foreground/55">
                      {t("assistantOverview.actionQueue.owner", { role: item.ownerRole ? t(`assistantSupportPage.ownerRole.${item.ownerRole}`, { defaultValue: item.ownerRole }) : t("roles.assistant") })}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.actionQueue.empty")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantOverview.supportQueue.title")}</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.supportQueue.subtitle")}
                  </p>
                </div>
                <span className="text-xs font-mono text-foreground/50">{data.studentSupportQueue.length}</span>
              </div>

              <div className="mt-4 space-y-3">
                {data.studentSupportQueue.length ? data.studentSupportQueue.slice(0, 6).map((item) => (
                  <article key={item.studentId} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.fullName ?? item.email ?? t("assistantSupportPage.studentFallback", { id: item.studentId })}</p>
                        <p className="mt-1 text-xs font-medium text-foreground/55">
                          {item.groupName ?? item.courseTitle ?? t("assistantOverview.supportQueue.workspaceFallback")}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {t(`assistantSupportPage.status.${item.supportStatus ?? "open"}`)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((reason) => (
                        <span key={`${item.studentId}-${reason.code}`} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
                          {t(`assistantSupportPage.reasons.${reason.code}`)}
                          {reason.count ? ` (${reason.count})` : ""}
                        </span>
                      ))}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("assistantOverview.supportQueue.empty")}
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
      ? "bg-brand-accent-soft text-accent"
      : "bg-muted text-foreground/65";

  return (
    <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {t(`assistantSupportPage.priority.${priority}`)}
    </span>
  );
}

function formatActionLabel(
  t: ReturnType<typeof useTranslation>["t"],
  type: string,
  i18nKey: string,
  params?: Record<string, string | number | null>,
) {
  const typeKey = `assistantOverview.actions.${type}`;
  if (i18n.exists(typeKey)) return t(typeKey, params ?? undefined);

  if (i18nKey) {
    if (i18n.exists(i18nKey)) return t(i18nKey, params ?? undefined);
    const legacyKey = i18nKey.replace(/^assistantOverview\.actions\./, "");
    const aliasKey = `assistantOverview.actions.${legacyKey}`;
    if (i18n.exists(aliasKey)) return t(aliasKey, params ?? undefined);
    return humanizeActionKey(legacyKey);
  }

  return t("assistantOverview.actions.default");
}

function humanizeActionKey(value: string) {
  return value
    .split(".")
    .pop()
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value;
}
