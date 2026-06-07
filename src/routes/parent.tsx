import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, CalendarClock, CheckCircle2, GraduationCap, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentChildSummary, useParentChildren } from "@/lib/parent-portal-api";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "QuestLMS — Parent" }] }),
  component: ParentLayout,
});

function ParentLayout() {
  const { pathname } = useLocation();
  if (pathname === "/parent") return <ParentDashboard />;
  return <Outlet />;
}

function ParentDashboard() {
  const childrenQuery = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const children = childrenQuery.data ?? [];
  const effectiveStudentId = selectedStudentId ?? children[0]?.studentId ?? null;
  const childSummaryQuery = useParentChildSummary(effectiveStudentId);
  const selectedChild = useMemo(
    () => children.find((item) => item.studentId === effectiveStudentId) ?? null,
    [children, effectiveStudentId],
  );

  return (
    <DashboardShell>
      <TopBar title="Parent Portal" subtitle="Track linked children, upcoming sessions, and urgent schoolwork." showStreak={false} />

      {childrenQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="h-72 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          title="No linked children yet"
          subtitle="This parent workspace becomes active after a guardian link is connected to your user account."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3 self-start">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Children</h2>
              <Link to="/parent/children" className="text-xs font-black text-primary hover:underline">
                Open all
              </Link>
            </div>
            <div className="space-y-3">
              {children.map((child) => {
                const active = child.studentId === effectiveStudentId;
                return (
                  <button
                    key={child.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(child.studentId)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="font-black">{child.fullName ?? child.email ?? `Student #${child.studentId}`}</div>
                    <div className="text-xs text-foreground/60 mt-1">{child.primaryLabel ?? "Linked learner"}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-foreground/70">
                      <span>{child.progressPercent}% progress</span>
                      <span>{child.attendanceRate == null ? "N/A" : `${child.attendanceRate}% attendance`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            {childSummaryQuery.isLoading || !selectedChild ? (
              <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
            ) : !childSummaryQuery.data ? (
              <EmptyState title="Child summary unavailable" subtitle="The selected child summary could not be loaded." />
            ) : (
              <>
                <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                        {selectedChild.primaryLabel ?? "Child summary"}
                      </p>
                      <h2 className="text-2xl font-black mt-2">{selectedChild.fullName ?? selectedChild.email}</h2>
                      <p className="text-sm text-foreground/60 mt-2">
                        {childSummaryQuery.data.home.nextSession?.sessionTitle
                          ? `Next session: ${childSummaryQuery.data.home.nextSession.sessionTitle}`
                          : "No upcoming session scheduled yet."}
                      </p>
                    </div>
                    <div className="text-sm text-foreground/60">
                      {childSummaryQuery.data.home.nextSession?.startsAt
                        ? new Date(childSummaryQuery.data.home.nextSession.startsAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard icon={<GraduationCap className="size-4" />} label="Progress" value={`${selectedChild.progressPercent}%`} hint={`${selectedChild.activeCourseCount} active courses`} />
                  <StatCard icon={<CheckCircle2 className="size-4" />} label="Attendance" value={selectedChild.attendanceRate == null ? "N/A" : `${selectedChild.attendanceRate}%`} hint={`${selectedChild.activeClassCount} active classes`} />
                  <StatCard icon={<Award className="size-4" />} label="Certificates" value={String(selectedChild.certificatesIssued)} hint={`${childSummaryQuery.data.profile.summary.completedCourses} completed courses`} />
                  <StatCard icon={<CalendarClock className="size-4" />} label="Urgent tasks" value={String(childSummaryQuery.data.home.urgentTasks.length)} hint={`${childSummaryQuery.data.home.recentFeedback.length} recent feedback items`} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                  <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black">Urgent tasks</h3>
                      <span className="text-xs font-bold text-foreground/60">{childSummaryQuery.data.home.urgentTasks.length}</span>
                    </div>
                    {childSummaryQuery.data.home.urgentTasks.length === 0 ? (
                      <p className="text-sm text-foreground/60">No urgent tasks for this child.</p>
                    ) : (
                      <div className="space-y-3">
                        {childSummaryQuery.data.home.urgentTasks.map((task) => (
                          <div key={task.id} className="rounded-2xl border-2 border-border bg-background p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-sm">{task.title}</p>
                                <p className="text-xs text-foreground/60 mt-1">{task.courseTitle ?? "Course task"} · {task.kind}</p>
                              </div>
                              <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/60">
                                {task.status}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-foreground/60">
                              Due {task.dueAt ? new Date(task.dueAt).toLocaleString() : "Not set"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black">Recent feedback</h3>
                      <Users className="size-4 text-foreground/40" />
                    </div>
                    {childSummaryQuery.data.home.recentFeedback.length === 0 ? (
                      <p className="text-sm text-foreground/60">No recent feedback yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {childSummaryQuery.data.home.recentFeedback.map((item) => (
                          <div key={`${item.kind}-${item.taskId}`} className="rounded-2xl border-2 border-border bg-background p-4">
                            <p className="font-black text-sm">{item.title}</p>
                            <p className="text-xs text-foreground/60 mt-1">{item.courseTitle ?? "Course activity"}</p>
                            <p className="mt-2 text-xs font-bold text-foreground/70">
                              {item.score == null ? item.status : `Score ${item.score}`}
                            </p>
                            {item.reviewComment ? <p className="mt-2 text-xs text-foreground/60">{item.reviewComment}</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
      <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2 text-foreground/70">{icon}</div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="mt-2 text-xl font-black leading-none">{value}</p>
      <p className="mt-2 text-xs text-foreground/60">{hint}</p>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
      <p className="font-black">{title}</p>
      <p className="text-sm text-foreground/60 mt-2">{subtitle}</p>
    </div>
  );
}
