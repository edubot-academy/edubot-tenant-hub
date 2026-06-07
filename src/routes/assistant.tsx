import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, ClipboardList, Layers3, UserRoundSearch } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAssistantDashboard } from "@/lib/assistant/assistant-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "QuestLMS — Assistant" }] }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { pathname } = useLocation();
  if (pathname === "/assistant") return <AssistantDashboard />;
  return <Outlet />;
}

function AssistantDashboard() {
  const { context } = useAppContext();
  const dashboardQuery = useAssistantDashboard();

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo assistant operations data.
        </section>
      </DashboardShell>
    );
  }

  const data = dashboardQuery.data;

  return (
    <DashboardShell>
      <TopBar title="Assistant" subtitle="Operational queue for support, coordination, and classroom blockers." showStreak={false} />

      {dashboardQuery.isLoading && (
        <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Loading assistant operations…
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          Failed to load assistant operations.
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <MetricCard label="Active classes" value={String(data.operations.activeGroups)} icon={<Layers3 className="size-4" />} />
            <MetricCard label="Upcoming sessions" value={String(data.operations.upcomingSessions)} icon={<CalendarClock className="size-4" />} />
            <MetricCard label="Students needing support" value={String(data.operations.studentsNeedingSupport)} icon={<UserRoundSearch className="size-4" />} />
            <MetricCard label="Pending invitations" value={String(data.operations.pendingInvitations)} icon={<ClipboardList className="size-4" />} />
            <MetricCard label="Blocked items" value={String(data.operations.blockedItems)} icon={<AlertCircle className="size-4" />} />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Action queue</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    Real operational blockers from the tenant workspace.
                  </p>
                </div>
                <Link to="/assistant/discussions" className="text-xs font-black text-primary hover:underline">
                  Open support queue
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
                      Owner: {item.ownerRole ?? "assistant"}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    No assistant blockers are currently open.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Support queue</h3>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    Students currently surfaced by support signals.
                  </p>
                </div>
                <span className="text-xs font-mono text-foreground/50">{data.studentSupportQueue.length}</span>
              </div>

              <div className="mt-4 space-y-3">
                {data.studentSupportQueue.length ? data.studentSupportQueue.slice(0, 6).map((item) => (
                  <article key={item.studentId} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.fullName ?? item.email ?? `Student #${item.studentId}`}</p>
                        <p className="mt-1 text-xs font-medium text-foreground/55">
                          {item.groupName ?? item.courseTitle ?? "Tenant workspace"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {item.supportStatus ?? "open"}
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
                    No student support cases are currently open.
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
  const className = priority === "high"
    ? "bg-destructive/15 text-destructive"
    : priority === "medium"
      ? "bg-accent/20 text-accent-foreground"
      : "bg-muted text-foreground/65";

  return (
    <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {priority}
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
