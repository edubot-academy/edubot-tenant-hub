import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { TodayHero } from "@/components/student/TodayHero";
import { QuizArenaCard } from "@/components/student/QuizArenaCard";
import { MyTodo } from "@/components/student/MyTodo";
import { CourseProgress } from "@/components/student/CourseProgress";
import { StreakCalendar } from "@/components/student/StreakCalendar";
import { XpLeague } from "@/components/student/XpLeague";
import { AchievementsWall } from "@/components/student/AchievementsWall";
import { AiTutorCard } from "@/components/student/AiTutorCard";
import { AlertCircle, BookOpen, CalendarClock, CheckCircle2, Clock3, GraduationCap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTenantModel } from "@/lib/app-context";
import { useStudentPortalClasses, useStudentPortalCourses, useStudentPortalHome, useStudentPortalReminders } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "QuestLMS — Student" }] }),
  component: StudentLayout,
});

function StudentLayout() {
  const { pathname } = useLocation();
  if (pathname === "/student") return <StudentDashboard />;
  return <Outlet />;
}

function StudentDashboard() {
  const tenantModel = useTenantModel();
  if (tenantModel === "academic") return <AcademicStudentDashboard />;
  return <CourseCenterStudentDashboard />;
}

function CourseCenterStudentDashboard() {
  const { t } = useTranslation();
  return (
    <DashboardShell>
      <TopBar
        title={t("student.topbar.title", { name: "Maria" })}
        subtitle={t("student.topbar.subtitle")}
      />

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8 lg:mb-10">
        <TodayHero />
        <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <XpLeague />
          <QuizArenaCard />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 mb-8 lg:mb-10">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <CourseProgress />
          <MyTodo />
          <AchievementsWall />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <StreakCalendar />
          <AiTutorCard />
        </div>
      </div>
    </DashboardShell>
  );
}

function AcademicStudentDashboard() {
  const classesQuery = useStudentPortalClasses();
  const coursesQuery = useStudentPortalCourses();
  const homeQuery = useStudentPortalHome();
  const remindersQuery = useStudentPortalReminders();

  const totalSubjects = (coursesQuery.data ?? []).length;
  const nextClass = homeQuery.data?.nextSession ?? null;
  const urgentTasks = (homeQuery.data?.urgentTasks ?? []).slice(0, 4);
  const reminders = (remindersQuery.data ?? []).slice(0, 4);

  return (
    <DashboardShell>
      <TopBar
        title="Academic workspace"
        subtitle="Track your classes, subjects, and scheduled sessions."
        showStreak={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <AcademicStatCard icon={<GraduationCap className="size-4" />} label="Classes" value={String((classesQuery.data ?? []).length)} />
        <AcademicStatCard icon={<BookOpen className="size-4" />} label="Subjects" value={String(totalSubjects)} />
        <AcademicStatCard icon={<Clock3 className="size-4" />} label="Open tasks" value={String(homeQuery.data?.progress.openTasks ?? 0)} />
        <AcademicStatCard icon={<CheckCircle2 className="size-4" />} label="Attendance" value={homeQuery.data?.progress.attendanceRate === null || homeQuery.data?.progress.attendanceRate === undefined ? "N/A" : `${homeQuery.data.progress.attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">My classes</h3>
              <Link to="/student/classes" className="text-sm font-bold text-primary hover:underline">View all</Link>
            </div>

            {classesQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className="h-40 rounded-3xl border-2 border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : (classesQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
                No academic classes assigned yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(classesQuery.data ?? []).slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to="/student/classes/$classId"
                    params={{ classId: String(item.id) }}
                    className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-black">{item.name}</h4>
                        <p className="text-xs font-medium text-foreground/55">
                          {item.code}
                          {item.gradeLevel ? ` · ${item.gradeLevel}` : ""}
                          {item.academicYear ? ` · ${item.academicYear}` : ""}
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                        {item.activeCourseCount} subjects
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground/60">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {item.studentCount} students</span>
                      <span>{item.advisor.name ?? "Advisor pending"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Urgent tasks</h3>
              <Link to="/student/submissions" className="text-sm font-bold text-primary hover:underline">Open submissions</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => <div key={index} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : urgentTasks.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No urgent tasks right now.</div>
            ) : (
              <ul className="space-y-2">
                {urgentTasks.map((task) => (
                  <li key={`${task.kind}-${task.id}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{task.title}</p>
                        <p className="text-xs font-medium text-foreground/55">{task.courseTitle ?? "Course"}</p>
                      </div>
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">{task.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <h3 className="text-lg font-black">Next session</h3>
            {homeQuery.isLoading ? (
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            ) : nextClass ? (
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="font-black">{nextClass.sessionTitle ?? "Scheduled session"}</p>
                <p className="mt-1 text-sm font-medium text-foreground/60">{nextClass.courseTitle ?? nextClass.groupName ?? "Academic class"}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-foreground/45">
                  {nextClass.startsAt ?? nextClass.startAt ?? "TBD"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No scheduled session yet.</div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <h3 className="text-lg font-black">Reminders</h3>
            {remindersQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => <div key={index} className="h-14 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : reminders.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No reminders.</div>
            ) : (
              <ul className="space-y-2">
                {reminders.map((item) => (
                  <li key={item.id} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-primary"><CalendarClock className="size-4" /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="text-xs font-medium text-foreground/55 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <h3 className="text-lg font-black">Academic model</h3>
            <p className="mt-2 text-sm font-medium text-foreground/60">
              This tenant is using class-first academic structure. Subjects and sessions are scoped through your assigned classes.
            </p>
            {homeQuery.data?.progress.overdueTasks ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4" />
                  <span>{homeQuery.data.progress.overdueTasks} overdue task(s) need attention.</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function AcademicStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
      <div className="flex items-center gap-2 text-foreground/60">{icon}<span className="text-xs font-black uppercase tracking-wider">{label}</span></div>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}
