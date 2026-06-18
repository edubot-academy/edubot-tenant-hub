import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Award, Clock, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import { useInstructorAnalyticsOverview } from "@/lib/instructor/instructor-analytics-api";

export const Route = createFileRoute("/instructor/analytics")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorAnalytics.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Instructor Analytics",
        }),
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t, i18n: activeI18n } = useTranslation();
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
      <TopBar
        title={t("instructorAnalytics.topbar.title", { defaultValue: "Analytics" })}
        subtitle={t("instructorAnalytics.topbar.subtitle", { defaultValue: "How your students and courses are performing" })}
      />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorAnalytics.state.prototype", { defaultValue: "Prototype mode uses demo instructor analytics." })}
        </section>
      ) : analyticsQuery.isLoading ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorAnalytics.state.loading", { defaultValue: "Loading instructor analytics…" })}
        </section>
      ) : analyticsQuery.isError || !data ? (
        <section className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive">
          {t("instructorAnalytics.state.error", { defaultValue: "Failed to load instructor analytics." })}
        </section>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard
              label={t("instructorAnalytics.metrics.activeStudents", { defaultValue: "Active students" })}
              value={String(data.summary.totalStudents)}
              detail={t("instructorAnalytics.metrics.enrollments", { count: data.summary.totalEnrollments, defaultValue: "{{count}} enrollments" })}
              icon={<Users className="size-4 text-primary" strokeWidth={2.5} />}
            />
            <MetricCard
              label={t("instructorAnalytics.metrics.avgCompletion", { defaultValue: "Avg completion" })}
              value={`${data.summary.averageCompletionRate}%`}
              detail={t("instructorAnalytics.metrics.publishedCourses", { published: data.summary.publishedCourses, total: data.summary.totalCourses, defaultValue: "{{published}}/{{total}} published" })}
              icon={<Activity className="size-4 text-primary" strokeWidth={2.5} />}
            />
            <MetricCard
              label={t("instructorAnalytics.metrics.avgProgress", { defaultValue: "Avg progress" })}
              value={`${averageProgress}%`}
              detail={t("instructorAnalytics.metrics.acrossAssigned", { defaultValue: "Across assigned courses" })}
              icon={<Award className="size-4 text-primary" strokeWidth={2.5} />}
            />
            <MetricCard
              label={t("instructorAnalytics.metrics.atRiskStudents", { defaultValue: "At-risk students" })}
              value={String(atRiskStudents.length)}
              detail={t("instructorAnalytics.metrics.needFollowUp", { defaultValue: "Need follow-up" })}
              icon={<Clock className="size-4 text-primary" strokeWidth={2.5} />}
            />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> {t("instructorAnalytics.sections.coursePerformance", { defaultValue: "Course performance" })}</h3>
              <div className="space-y-3">
                {coursePerformance.length ? coursePerformance.map((course) => (
                  <div key={course.courseId} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{course.title}</div>
                        <div className="mt-1 text-xs font-medium text-foreground/55">
                          {t("instructorAnalytics.labels.enrollments", { count: course.enrollments, defaultValue: "{{count}} enrollments" })}
                        </div>
                      </div>
                      <div className="text-right text-xs font-mono font-black text-foreground/70">
                        {t("instructorAnalytics.labels.complete", { value: course.completionRate, defaultValue: "{{value}}% complete" })}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full border border-border bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${course.averageProgress}%` }} />
                    </div>
                    <div className="mt-2 text-xs font-medium text-foreground/60">
                      {t("instructorAnalytics.labels.averageProgress", { value: course.averageProgress, defaultValue: "Average progress: {{value}}%" })}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("instructorAnalytics.empty.coursePerformance", { defaultValue: "No course performance data available yet." })}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <h3 className="mb-4 text-lg font-black">{t("instructorAnalytics.sections.weakLessons", { defaultValue: "Weak lessons" })}</h3>
              <div className="space-y-3">
                {weakLessons.length ? weakLessons.map((lesson) => (
                  <div key={lesson.lessonId} className="rounded-2xl border border-border p-4">
                    <div className="text-sm font-black">{lesson.title}</div>
                    <div className="mt-1 text-xs font-medium text-foreground/55">{lesson.courseTitle}</div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-mono font-black">
                      <span>{t("instructorAnalytics.labels.completion", { defaultValue: "Completion" })}</span>
                      <span>{lesson.completionRate}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full border border-border bg-muted">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${lesson.completionRate}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                    {t("instructorAnalytics.empty.weakLessons", { defaultValue: "No weak lessons detected." })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><AlertTriangle className="size-5 text-primary" strokeWidth={2.5} /> {t("instructorAnalytics.sections.studentsAtRisk", { defaultValue: "Students at risk" })}</h3>
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
                      {formatDate(student.lastActivity, activeI18n.language)}
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  {t("instructorAnalytics.empty.atRiskStudents", { defaultValue: "No at-risk students are currently flagged." })}
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

function formatDate(value: string, language: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
  }).format(date);
}
