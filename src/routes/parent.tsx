import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Award, CalendarClock, CheckCircle2, GraduationCap, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentChildSummary, useParentChildren } from "@/lib/parent-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: i18n.t("parentOverview.meta.title") }] }),
  component: ParentLayout,
});

function ParentLayout() {
  const { pathname } = useLocation();
  if (pathname === "/parent") return <Navigate to="/" replace />;
  return <Outlet />;
}

export function ParentDashboard() {
  const { t, i18n: i18next } = useTranslation();
  const locale = i18next.language;
  const childrenQuery = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const children = childrenQuery.data ?? [];
  const effectiveStudentId = selectedStudentId ?? children[0]?.studentId ?? null;
  const childSummaryQuery = useParentChildSummary(effectiveStudentId);
  const selectedChild = useMemo(
    () => children.find((item) => item.studentId === effectiveStudentId) ?? null,
    [children, effectiveStudentId],
  );

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <DashboardShell>
      <TopBar title={t("parentOverview.topbar.title")} subtitle={t("parentOverview.topbar.subtitle")} showStreak={false} />

      {childrenQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="h-72 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          title={t("parentOverview.empty.noChildrenTitle")}
          subtitle={t("parentOverview.empty.noChildrenBody")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3 self-start">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">{t("parentOverview.children.title")}</h2>
              <Link to="/parent/children" className="text-xs font-black text-primary hover:underline">
                {t("parentOverview.children.openAll")}
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
                    <div className="font-black">{child.fullName ?? child.email ?? t("parentOverview.children.studentFallback", { id: child.studentId })}</div>
                    <div className="text-xs text-foreground/60 mt-1">{child.primaryLabel ?? t("parentOverview.children.linkedLearner")}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-foreground/70">
                      <span>{t("parentOverview.children.progress", { value: child.progressPercent })}</span>
                      <span>{child.attendanceRate == null ? "—" : t("parentOverview.children.attendance", { value: child.attendanceRate })}</span>
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
              <EmptyState title={t("parentOverview.empty.summaryUnavailableTitle")} subtitle={t("parentOverview.empty.summaryUnavailableBody")} />
            ) : (
              <>
                <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                        {selectedChild.primaryLabel ?? t("parentOverview.children.childSummary")}
                      </p>
                      <h2 className="text-2xl font-black mt-2">{selectedChild.fullName ?? selectedChild.email}</h2>
                      <p className="text-sm text-foreground/60 mt-2">
                        {childSummaryQuery.data.home.nextSession?.sessionTitle
                          ? t("parentOverview.sessions.next", { title: childSummaryQuery.data.home.nextSession.sessionTitle })
                          : t("parentOverview.sessions.none")}
                      </p>
                    </div>
                    <div className="text-sm text-foreground/60">
                      {formatDateTime(childSummaryQuery.data.home.nextSession?.startsAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard icon={<GraduationCap className="size-4" />} label={t("parentOverview.stats.progress")} value={`${selectedChild.progressPercent}%`} hint={t("parentOverview.stats.activeCourses", { count: selectedChild.activeCourseCount })} />
                  <StatCard icon={<CheckCircle2 className="size-4" />} label={t("parentOverview.stats.attendance")} value={selectedChild.attendanceRate == null ? "—" : `${selectedChild.attendanceRate}%`} hint={t("parentOverview.stats.activeClasses", { count: selectedChild.activeClassCount })} />
                  <StatCard icon={<Award className="size-4" />} label={t("parentOverview.stats.certificates")} value={String(selectedChild.certificatesIssued)} hint={t("parentOverview.stats.completedCourses", { count: childSummaryQuery.data.profile.summary.completedCourses })} />
                  <StatCard icon={<CalendarClock className="size-4" />} label={t("parentOverview.stats.urgentTasks")} value={String(childSummaryQuery.data.home.urgentTasks.length)} hint={t("parentOverview.stats.recentFeedback", { count: childSummaryQuery.data.home.recentFeedback.length })} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                  <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black">{t("parentOverview.tasks.title")}</h3>
                      <span className="text-xs font-bold text-foreground/60">{childSummaryQuery.data.home.urgentTasks.length}</span>
                    </div>
                    {childSummaryQuery.data.home.urgentTasks.length === 0 ? (
                      <p className="text-sm text-foreground/60">{t("parentOverview.tasks.none")}</p>
                    ) : (
                      <div className="space-y-3">
                        {childSummaryQuery.data.home.urgentTasks.map((task) => (
                          <div key={task.id} className="rounded-2xl border-2 border-border bg-background p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-sm">{task.title}</p>
                                <p className="text-xs text-foreground/60 mt-1">
                                  {task.courseTitle ?? t("parentOverview.tasks.courseTask")} · {t(`parentOverview.tasks.kind.${task.kind}`, { defaultValue: task.kind })}
                                </p>
                              </div>
                              <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/60">
                                {t(`parentOverview.tasks.status.${task.status}`, { defaultValue: task.status })}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-foreground/60">
                              {t("parentOverview.tasks.due", { date: task.dueAt ? formatDateTime(task.dueAt) : t("parentOverview.tasks.notSet") })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black">{t("parentOverview.feedback.title")}</h3>
                      <Users className="size-4 text-foreground/40" />
                    </div>
                    {childSummaryQuery.data.home.recentFeedback.length === 0 ? (
                      <p className="text-sm text-foreground/60">{t("parentOverview.feedback.none")}</p>
                    ) : (
                      <div className="space-y-3">
                        {childSummaryQuery.data.home.recentFeedback.map((item) => (
                          <div key={`${item.kind}-${item.taskId}`} className="rounded-2xl border-2 border-border bg-background p-4">
                            <p className="font-black text-sm">{item.title}</p>
                            <p className="text-xs text-foreground/60 mt-1">{item.courseTitle ?? t("parentOverview.feedback.courseActivity")}</p>
                            <p className="mt-2 text-xs font-bold text-foreground/70">
                              {item.score == null
                                ? t(`parentOverview.feedback.status.${item.status}`, { defaultValue: item.status })
                                : t("parentOverview.feedback.score", { score: item.score })}
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

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
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
