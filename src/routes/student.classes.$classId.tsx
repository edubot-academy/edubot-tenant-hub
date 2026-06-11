import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useStudentPortalClassDetail } from "@/lib/student-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/classes/$classId")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.classes.detailMetaTitle", { appName: i18n.t("app.name") }) }] }),
  component: StudentClassDetailPage,
});

function StudentClassDetailPage() {
  const { t } = useTranslation();
  const { classId } = Route.useParams();
  const numericClassId = Number(classId);
  const classQuery = useStudentPortalClassDetail(Number.isFinite(numericClassId) ? numericClassId : null);

  const statusLabel = (status: string) => t(`studentPages.status.${status}`, { defaultValue: status.replace(/_/g, " ") });

  return (
    <DashboardShell>
      <TopBar
        title={classQuery.data?.name ?? t("studentPages.classes.detailFallbackTitle")}
        subtitle={classQuery.data?.code ?? t("studentPages.classes.detailFallbackSubtitle")}
        showStreak={false}
      />

      <Link to="/student/classes" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("studentPages.classes.allClasses")}
      </Link>

      {classQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      ) : classQuery.isError || !classQuery.data ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("studentPages.classes.loadError")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{classQuery.data.name}</h2>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {classQuery.data.code}
                    {classQuery.data.gradeLevel ? ` · ${classQuery.data.gradeLevel}` : ""}
                    {classQuery.data.academicYear ? ` · ${classQuery.data.academicYear}` : ""}
                  </p>
                </div>
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  {statusLabel(classQuery.data.status)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat icon={<Users className="size-4" />} label={t("studentPages.classes.students")} value={String(classQuery.data.studentCount)} />
                <Stat icon={<BookOpen className="size-4" />} label={t("studentPages.classes.subjects")} value={String(classQuery.data.activeCourseCount)} />
                <Stat icon={<CalendarDays className="size-4" />} label={t("studentPages.classes.attendance")} value={classQuery.data.attendance.rate === null ? t("studentPages.common.notAvailable") : `${classQuery.data.attendance.rate}%`} />
              </div>
            </div>

            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
              <h3 className="text-lg font-black">{t("studentPages.classes.subjectsTitle")}</h3>
              {classQuery.data.courses.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                  {t("studentPages.classes.noSubjects")}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {classQuery.data.courses.map((course) => (
                    <Link
                      key={course.id}
                      to="/course-player"
                      search={{ courseId: course.courseId, groupId: classQuery.data?.id }}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-muted/20 p-4 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{course.title}</p>
                        <p className="truncate text-xs font-medium text-foreground/55">
                          {course.instructor.name ?? t("studentPages.classes.instructorPending")}
                        </p>
                      </div>
                      <span className="rounded-lg bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">
                        {statusLabel(course.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow h-fit space-y-4">
            <h3 className="text-lg font-black">{t("studentPages.classes.upcomingSessions")}</h3>
            {classQuery.data.upcomingSessions.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">
                {t("studentPages.classes.noUpcomingSessions")}
              </div>
            ) : (
              <ul className="space-y-2">
                {classQuery.data.upcomingSessions.map((session) => (
                  <li key={session.id} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                    <p className="text-sm font-black">{session.sessionTitle}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-foreground/55">
                      <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {session.startsAt ?? session.startAt ?? t("studentPages.common.tbd")}</span>
                      <span>{session.courseTitle ?? t("studentPages.common.subject")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-foreground/55">{icon}<span className="text-[10px] font-black uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
