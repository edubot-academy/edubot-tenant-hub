import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Award, Clock, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import { useInstructorAnalyticsOverview } from "@/lib/instructor/instructor-analytics-api";

export const Route = createFileRoute("/instructor/analytics")({
  head: () => ({ meta: [{ title: "QuestLMS — Instructor Analytics" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { context } = useAppContext();
  const analyticsQuery = useInstructorAnalyticsOverview();
  const data = analyticsQuery.data;
  const coursePerformance = data?.charts.coursePerformance ?? [];
  const atRiskStudents = data?.charts.atRiskStudents ?? [];
  const weakLessons = data?.charts.weakLessons ?? [];
  const totalEnrollments = data?.summary.totalEnrollments ?? 0;
  const averageProgress =
    coursePerformance.length > 0
      ? Math.round(coursePerformance.reduce((sum, item) => sum + item.averageProgress, 0) / coursePerformance.length)
      : 0;

  return (
    <DashboardShell>
      <TopBar title="Analytics" subtitle="How your students and courses are performing" />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo instructor analytics.
        </section>
      ) : analyticsQuery.isLoading ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Loading instructor analytics…
        </section>
      ) : analyticsQuery.isError || !data ? (
        <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          Failed to load instructor analytics.
        </section>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Active students" value={String(data.summary.totalStudents)} detail={`${data.summary.totalEnrollments} enrollments`} icon={<Users className="size-4 text-primary" strokeWidth={2.5} />} />
            <MetricCard label="Avg completion" value={`${data.summary.averageCompletionRate}%`} detail={`${data.summary.publishedCourses}/${data.summary.totalCourses} published`} icon={<Activity className="size-4 text-primary" strokeWidth={2.5} />} />
            <MetricCard label="Avg progress" value={`${averageProgress}%`} detail="Across assigned courses" icon={<Award className="size-4 text-primary" strokeWidth={2.5} />} />
            <MetricCard label="At-risk students" value={String(atRiskStudents.length)} detail="Need follow-up" icon={<Clock className="size-4 text-primary" strokeWidth={2.5} />} />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> Course performance</h3>
              <div className="space-y-3">
                {coursePerformance.length ? coursePerformance.map((course) => (
                  <div key={course.courseId} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{course.title}</div>
                        <div className="mt-1 text-xs font-medium text-foreground/55">{course.enrollments} enrollments</div>
                      </div>
                      <div className="text-right text-xs font-mono font-black text-foreground/70">
                        {course.completionRate}% complete
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full border border-border bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${course.averageProgress}%` }} />
                    </div>
                    <div className="mt-2 text-xs font-medium text-foreground/60">Average progress: {course.averageProgress}%</div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    No course performance data available yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <h3 className="mb-4 text-lg font-black">Weak lessons</h3>
              <div className="space-y-3">
                {weakLessons.length ? weakLessons.map((lesson) => (
                  <div key={lesson.lessonId} className="rounded-2xl border border-border p-4">
                    <div className="text-sm font-black">{lesson.title}</div>
                    <div className="mt-1 text-xs font-medium text-foreground/55">{lesson.courseTitle}</div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-mono font-black">
                      <span>Completion</span>
                      <span>{lesson.completionRate}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full border border-border bg-muted">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${lesson.completionRate}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    No weak lessons detected.
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><AlertTriangle className="size-5 text-primary" strokeWidth={2.5} /> Students at risk</h3>
            <div className="space-y-3">
              {atRiskStudents.length ? atRiskStudents.map((student) => (
                <article key={`${student.studentId}-${student.courseId}`} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black">{student.studentName}</div>
                      <div className="mt-1 text-xs font-medium text-foreground/55">{student.courseTitle}</div>
                      <div className="mt-2 text-sm font-medium text-foreground/70">{student.riskReason}</div>
                    </div>
                    <div className="text-right text-xs font-mono font-black text-foreground/50">
                      {formatDate(student.lastActivity)}
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  No at-risk students are currently flagged.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black font-mono">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-foreground/60">{detail}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}
