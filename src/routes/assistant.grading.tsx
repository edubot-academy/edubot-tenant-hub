import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, ExternalLink, Info } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/assistant/grading")({
  head: () => ({ meta: [{ title: "QuestLMS — Grading Queue" }] }),
  component: AssistantGradingPage,
});

function AssistantGradingPage() {
  const { context } = useAppContext();
  const dashboardQuery = useAssistantDashboard();

  return (
    <DashboardShell>
      <TopBar title="Grading Queue" subtitle="Review availability and grading-related blockers." showStreak={false} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses a demo grading queue.
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><ClipboardCheck className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Dedicated grading queue is not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Backend mode currently exposes assistant operations and support workload, but it does not expose a role-specific grading queue contract. This page stays truthful until that workflow is added.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/70">
              Use instructor-facing grading or class session workflows for actual submission review. Assistant operations continue to surface staffing and support blockers from the dashboard.
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-2 text-foreground/55">
              <Info className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Current assistant workload</span>
            </div>
            {dashboardQuery.isLoading ? (
              <div className="mt-4 text-sm font-medium text-foreground/60">Loading assistant operations…</div>
            ) : dashboardQuery.isError ? (
              <div className="mt-4 text-sm font-medium text-destructive">Failed to load assistant operations.</div>
            ) : (
              <div className="mt-4 space-y-3">
                <Metric label="Students needing support" value={String(dashboardQuery.data?.operations.studentsNeedingSupport ?? 0)} />
                <Metric label="Sessions without meeting" value={String(dashboardQuery.data?.operations.sessionsWithoutMeeting ?? 0)} />
                <Metric label="Groups without instructor" value={String(dashboardQuery.data?.operations.groupsWithoutInstructor ?? 0)} />
                <Link to="/assistant" className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline">
                  Open assistant dashboard
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="text-[10px] font-black uppercase tracking-wider text-foreground/55">{label}</div>
      <div className="mt-2 text-2xl font-black font-mono">{value}</div>
    </div>
  );
}
