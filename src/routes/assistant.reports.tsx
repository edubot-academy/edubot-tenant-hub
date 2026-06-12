import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, GraduationCap, UserRoundSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import "@/lib/assistant/assistant-i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/assistant/reports")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.assistant.reports")}` }] }),
  component: AssistantReportsPage,
});

function AssistantReportsPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const dashboardQuery = useAssistantDashboard();
  const data = dashboardQuery.data;

  return (
    <DashboardShell>
      <TopBar title={t("assistantReportsPage.title")} subtitle={t("assistantReportsPage.subtitle")} showStreak={false} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("assistantReportsPage.prototype")}
        </section>
      ) : dashboardQuery.isLoading ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("assistantReportsPage.loading")}
        </section>
      ) : dashboardQuery.isError || !data ? (
        <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          {t("assistantReportsPage.error")}
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label={t("assistantOverview.metrics.activeClasses")} value={String(data.operations.activeGroups)} icon={<GraduationCap className="size-4" />} />
            <MetricCard label={t("assistantOverview.metrics.upcomingSessions")} value={String(data.operations.upcomingSessions)} icon={<CalendarClock className="size-4" />} />
            <MetricCard label={t("assistantReportsPage.metrics.supportLoad")} value={String(data.operations.studentsNeedingSupport)} icon={<UserRoundSearch className="size-4" />} />
            <MetricCard label={t("assistantReportsPage.metrics.blockedOperations")} value={String(data.operations.blockedItems)} icon={<AlertCircle className="size-4" />} />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantReportsPage.backlog.title")}</h3>
              <div className="mt-4 space-y-3">
                <BreakdownRow label={t("assistantReportsPage.backlog.pendingInvitations")} value={data.operations.pendingInvitations} />
                <BreakdownRow label={t("assistantReportsPage.backlog.pendingEnrollments")} value={data.operations.pendingEnrollments} />
                <BreakdownRow label={t("assistantReportsPage.backlog.groupsWithoutInstructor")} value={data.operations.groupsWithoutInstructor} />
                <BreakdownRow label={t("assistantReportsPage.backlog.sessionsWithoutMeeting")} value={data.operations.sessionsWithoutMeeting} />
              </div>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <h3 className="text-sm font-black uppercase tracking-wider">{t("assistantReportsPage.actionMix.title")}</h3>
              <div className="mt-4 space-y-3">
                {data.actionQueue.length ? data.actionQueue.map((item) => (
                  <BreakdownRow key={item.id} label={formatActionLabel(t, item.type, item.i18nKey, item.params)} value={Number(item.params?.count ?? 1)} />
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("assistantReportsPage.actionMix.empty")}
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

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 p-4">
      <span className="text-sm font-medium text-foreground/70">{label}</span>
      <span className="text-lg font-black font-mono">{value}</span>
    </div>
  );
}

function formatActionLabel(
  t: ReturnType<typeof useTranslation>["t"],
  type: string,
  i18nKey: string,
  params?: Record<string, string | number | null>,
) {
  const translated = t(`assistantOverview.actions.${type}`, {
    ...params,
    defaultValue: "",
  });
  if (translated) return translated;

  if (i18nKey && !i18nKey.includes(".")) return i18nKey;
  return t("assistantOverview.actions.default");
}
