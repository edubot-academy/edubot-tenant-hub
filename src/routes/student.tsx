import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
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

import { useAppContext, useTenantModel } from "@/lib/app-context";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useStudentPortalClasses, useStudentPortalCourses, useStudentPortalHome, useStudentPortalReminders } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "QuestLMS — Student" }] }),
  component: StudentLayout,
});

function StudentLayout() {
  const { pathname } = useLocation();
  if (pathname === "/student") return <Navigate to="/" replace />;
  return <Outlet />;
}

export function StudentDashboard() {
  const { context } = useAppContext();
  const tenantModel = useTenantModel();
  if (tenantModel === "academic") return <AcademicStudentDashboard />;
  if (isBackendApiEnabled() && context.mode === "backend") return <CourseCenterStudentBackendDashboard />;
  return <CourseCenterStudentDashboard />;
}

function CourseCenterStudentBackendDashboard() {
  const homeQuery = useStudentPortalHome();
  const home = homeQuery.data;
  const urgentTasks = (home?.urgentTasks ?? []).slice(0, 5);
  const recentFeedback = (home?.recentFeedback ?? []).slice(0, 3);
  const nextSession = home?.nextSession ?? null;
  const studentName = home?.student.fullName ?? null;

  return (
    <DashboardShell>
      <TopBar
        title={studentName ? `Welcome back, ${studentName.split(" ")[0]}` : "Student workspace"}
        subtitle="Track your courses, upcoming sessions, and tasks."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { l: "Open tasks", v: home?.progress.openTasks ?? "—" },
          { l: "Overdue", v: home?.progress.overdueTasks ?? "—" },
          { l: "Avg progress", v: home?.progress.averageProgressPercent !== undefined ? `${Math.round(home.progress.averageProgressPercent)}%` : "—" },
          { l: "Certificates", v: home?.progress.certificatesIssued ?? "—" },
        ].map((s) => (
          <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
            <p className="text-2xl font-black font-mono mt-1">{homeQuery.isLoading ? <span className="block h-7 w-12 bg-muted animate-pulse rounded" /> : s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <CourseProgress />

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Urgent tasks</h3>
              <Link to="/student/submissions" className="text-sm font-bold text-primary hover:underline">All submissions</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : urgentTasks.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> All caught up — no urgent tasks.
              </div>
            ) : (
              <ul className="space-y-2">
                {urgentTasks.map((task) => (
                  <li key={`${task.kind}-${task.id}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{task.title}</p>
                      <p className="text-xs font-medium text-foreground/55">{task.courseTitle ?? "Course"}{task.dueAt ? ` · Due ${new Date(task.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">{task.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {recentFeedback.length > 0 && (
            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
              <h3 className="text-lg font-black">Recent feedback</h3>
              <ul className="space-y-2">
                {recentFeedback.map((fb) => (
                  <li key={`${fb.kind}-${fb.taskId}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{fb.title}</p>
                      <p className="text-xs font-medium text-foreground/55">{fb.courseTitle ?? "Course"}</p>
                      {fb.reviewComment && <p className="mt-1 text-xs text-foreground/70 line-clamp-2">{fb.reviewComment}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      {fb.score !== null && <p className="text-sm font-black font-mono">{fb.score} pts</p>}
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">{fb.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <h3 className="text-lg font-black">Next session</h3>
            {homeQuery.isLoading ? (
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            ) : nextSession ? (
              <div className="rounded-2xl bg-primary/5 border-2 border-primary/20 p-4 space-y-1">
                <p className="font-black">{nextSession.sessionTitle ?? "Upcoming session"}</p>
                <p className="text-sm font-medium text-foreground/60">{nextSession.courseTitle ?? nextSession.groupName ?? ""}</p>
                {(nextSession.startsAt ?? nextSession.startAt) && (
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/45">
                    {new Date(nextSession.startsAt ?? nextSession.startAt!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {nextSession.liveJoinUrl && (
                  <a href={nextSession.liveJoinUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-primary hover:underline">
                    Join live →
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No upcoming sessions.</div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">My courses</h3>
              <Link to="/student/courses" className="text-sm font-bold text-primary hover:underline">View all</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : (home?.activeCourses ?? []).length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No enrolled courses yet.</div>
            ) : (
              <ul className="space-y-2">
                {(home?.activeCourses ?? []).slice(0, 4).map((c) => (
                  <li key={c.courseId}>
                    <Link
                      to="/course-player"
                      search={{ courseId: c.courseId, groupId: c.groupId ?? undefined }}
                      className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/20 p-3 hover:border-foreground/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">{c.title}</p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${c.progressPercent ?? 0}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-foreground/50">{c.progressPercent ?? 0}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
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
