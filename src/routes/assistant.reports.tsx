import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, GraduationCap, UserRoundSearch } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/assistant/reports")({
  head: () => ({ meta: [{ title: "QuestLMS — Reports" }] }),
  component: AssistantReportsPage,
});

function AssistantReportsPage() {
  const { context } = useAppContext();
  const dashboardQuery = useAssistantDashboard();
  const data = dashboardQuery.data;

  return (
    <DashboardShell>
      <TopBar title="Reports" subtitle="Operational assistant metrics from the current tenant workspace." showStreak={false} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo assistant analytics.
        </section>
      ) : dashboardQuery.isLoading ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Loading assistant report metrics…
        </section>
      ) : dashboardQuery.isError || !data ? (
        <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          Failed to load assistant report metrics.
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Active classes" value={String(data.operations.activeGroups)} icon={<GraduationCap className="size-4" />} />
            <MetricCard label="Upcoming sessions" value={String(data.operations.upcomingSessions)} icon={<CalendarClock className="size-4" />} />
            <MetricCard label="Support load" value={String(data.operations.studentsNeedingSupport)} icon={<UserRoundSearch className="size-4" />} />
            <MetricCard label="Blocked operations" value={String(data.operations.blockedItems)} icon={<AlertCircle className="size-4" />} />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <h3 className="text-sm font-black uppercase tracking-wider">Operational backlog</h3>
              <div className="mt-4 space-y-3">
                <BreakdownRow label="Pending invitations" value={data.operations.pendingInvitations} />
                <BreakdownRow label="Pending enrollments" value={data.operations.pendingEnrollments} />
                <BreakdownRow label="Groups without instructor" value={data.operations.groupsWithoutInstructor} />
                <BreakdownRow label="Sessions without meeting" value={data.operations.sessionsWithoutMeeting} />
              </div>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <h3 className="text-sm font-black uppercase tracking-wider">Action queue mix</h3>
              <div className="mt-4 space-y-3">
                {data.actionQueue.length ? data.actionQueue.map((item) => (
                  <BreakdownRow key={item.id} label={item.i18nKey} value={Number(item.params?.count ?? 1)} />
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    No action queue items are currently open.
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
