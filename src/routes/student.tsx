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
import { BookOpen, CalendarClock, CheckCircle2, Clock3, GraduationCap, Users, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppContext, useTenantModel } from "@/lib/app-context";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useStudentPortalClasses, useStudentPortalCourses, useStudentPortalDashboard, useStudentPortalReminders } from "@/lib/student-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: i18n.t("studentOverview.meta.title") }] }),
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
  const { t } = useTranslation();
  const homeQuery = useStudentPortalDashboard();
  const home = homeQuery.data;
  const urgentTasks = (home?.urgentTasks ?? []).slice(0, 5);
  const recentFeedback = (home?.recentFeedback ?? []).slice(0, 3);
  const nextSession = home?.nextSession ?? null;
  const studentName = home?.student.fullName ?? null;
  const firstName = studentName?.split(" ")[0];
  const overdue = home?.progress.overdueTasks ?? 0;

  return (
    <DashboardShell>
            <TopBar
        title={firstName ? t("studentOverview.topbar.welcomeBack", { name: firstName }) : t("studentOverview.topbar.workspace")}
        subtitle={t("studentOverview.topbar.subtitle")}
            />

      {/* Next session hero — first thing a student sees */}
      {homeQuery.isLoading ? (
        <div className="h-28 rounded-3xl bg-muted animate-pulse mb-8" />
      ) : nextSession ? (
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-5 sm:p-7 mb-8 chunky-shadow">
          <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-foreground/15 backdrop-blur-sm rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                <span className="size-1.5 bg-accent rounded-full animate-pulse" />
                Next session
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{nextSession.sessionTitle ?? "Upcoming session"}</h2>
              <p className="text-primary-foreground/70 text-sm font-medium mt-0.5">{nextSession.courseTitle ?? nextSession.groupName ?? ""}</p>
              {(nextSession.startsAt ?? nextSession.startAt) && (
                <p className="text-primary-foreground/60 text-xs font-bold uppercase tracking-wider mt-2">
                  {new Date(nextSession.startsAt ?? nextSession.startAt!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {nextSession.liveJoinUrl && (
              <a
                href={nextSession.liveJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-5 py-3 bg-card text-primary rounded-2xl font-black text-sm hover:scale-105 transition-transform chunky-shadow"
              >
                Join live →
              </a>
            )}
          </div>
          <div className="absolute -right-10 -bottom-10 size-52 bg-primary-foreground/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      ) : null}

      {/* Stats row — overdue gets amber treatment when > 0 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { l: t("studentOverview.stats.openTasks"), v: home?.progress.openTasks ?? "—", warn: false },
          { l: t("studentOverview.stats.overdue"), v: home?.progress.overdueTasks ?? "—", warn: overdue > 0 },
          { l: t("studentOverview.stats.avgProgress"), v: home?.progress.averageProgressPercent !== undefined ? `${Math.round(home.progress.averageProgressPercent)}%` : "—", warn: false },
          { l: t("studentOverview.stats.certificates"), v: home?.progress.certificatesIssued ?? "—", warn: false },
        ].map((s) => (
          <div key={s.l} className={`border-2 rounded-2xl p-4 chunky-shadow ${s.warn ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" : "bg-card border-border"}`}>
            <p className={`text-xs font-black uppercase tracking-wider ${s.warn ? "text-amber-600 dark:text-amber-400" : "text-foreground/50"}`}>{s.l}</p>
            <p className={`text-2xl font-black font-mono mt-1 ${s.warn ? "text-amber-700 dark:text-amber-300" : ""}`}>
              {homeQuery.isLoading ? <span className="block h-7 w-12 bg-muted animate-pulse rounded" /> : s.v}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <CourseProgress />

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{t("studentOverview.tasks.urgentTitle")}</h3>
              <Link to="/student/submissions" className="text-sm font-bold text-primary hover:underline">{t("studentOverview.tasks.allSubmissions")}</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : urgentTasks.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> {t("studentOverview.tasks.allCaughtUp")}
              </div>
            ) : (
              <ul className="space-y-2">
                {urgentTasks.map((task) => {
                  const dueDate = task.dueAt
                    ? new Date(task.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : null;
                  return (
                    <li key={`${task.kind}-${task.id}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate">{task.title}</p>
                        <p className="text-xs font-medium text-foreground/55">
                          {task.courseTitle ?? t("studentOverview.tasks.courseFallback")}
                          {dueDate ? ` · ${t("studentOverview.tasks.due", { date: dueDate })}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">{task.status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {recentFeedback.length > 0 && (
            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
              <h3 className="text-lg font-black">{t("studentOverview.feedback.title")}</h3>
              <ul className="space-y-2">
                {recentFeedback.map((fb) => (
                  <li key={`${fb.kind}-${fb.taskId}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{fb.title}</p>
                      <p className="text-xs font-medium text-foreground/55">{fb.courseTitle ?? t("studentOverview.tasks.courseFallback")}</p>
                      {fb.reviewComment && <p className="mt-1 text-xs text-foreground/70 line-clamp-2">{fb.reviewComment}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      {fb.score !== null && <p className="text-sm font-black font-mono">{t("studentOverview.feedback.points", { score: fb.score })}</p>}
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
            <h3 className="text-lg font-black">{t("studentOverview.sessions.nextTitle")}</h3>
            {homeQuery.isLoading ? (
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            ) : nextSession ? (
              <div className="rounded-2xl bg-primary/5 border-2 border-primary/20 p-4 space-y-1">
                <p className="font-black">{nextSession.sessionTitle ?? t("studentOverview.sessions.upcomingFallback")}</p>
                <p className="text-sm font-medium text-foreground/60">{nextSession.courseTitle ?? nextSession.groupName ?? ""}</p>
                {(nextSession.startsAt ?? nextSession.startAt) && (
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/45">
                    {new Date(nextSession.startsAt ?? nextSession.startAt!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {nextSession.liveJoinUrl && (
                  <a href={nextSession.liveJoinUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-primary hover:underline">
                    {t("studentOverview.sessions.joinLive")}
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentOverview.sessions.noneUpcoming")}</div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{t("studentOverview.courses.title")}</h3>
              <Link to="/student/courses" className="text-sm font-bold text-primary hover:underline">{t("studentOverview.courses.viewAll")}</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : (home?.activeCourses ?? []).length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentOverview.courses.none")}</div>
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
  const { context } = useAppContext();
  const aiEnabled = Boolean(context.featureFlags.ai);
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
          {aiEnabled && <AiTutorCard />}
        </div>
      </div>
    </DashboardShell>
  );
}

function AcademicStudentDashboard() {
  const { t } = useTranslation();
  const classesQuery = useStudentPortalClasses();
  const coursesQuery = useStudentPortalCourses();
  const homeQuery = useStudentPortalDashboard();
  const remindersQuery = useStudentPortalReminders();

  const studentName = homeQuery.data?.student.fullName ?? null;
  const totalSubjects = (coursesQuery.data ?? []).length;
  const nextClass = homeQuery.data?.nextSession ?? null;
  const urgentTasks = (homeQuery.data?.urgentTasks ?? []).slice(0, 4);
  const reminders = (remindersQuery.data ?? []).slice(0, 4);

  return (
    <DashboardShell>
            <TopBar
        title={t("studentOverview.topbar.academicTitle")}
        subtitle={t("studentOverview.topbar.academicSubtitle")}
        showStreak={false}
            />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <AcademicStatCard icon={<GraduationCap className="size-4" />} label={t("studentOverview.stats.classes")} value={String((classesQuery.data ?? []).length)} />
        <AcademicStatCard icon={<BookOpen className="size-4" />} label={t("studentOverview.stats.subjects")} value={String(totalSubjects)} />
        <AcademicStatCard icon={<Clock3 className="size-4" />} label={t("studentOverview.stats.openTasks")} value={String(homeQuery.data?.progress.openTasks ?? 0)} />
        <AcademicStatCard icon={<CheckCircle2 className="size-4" />} label={t("studentOverview.stats.attendance")} value={homeQuery.data?.progress.attendanceRate === null || homeQuery.data?.progress.attendanceRate === undefined ? "—" : `${homeQuery.data.progress.attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">{t("studentOverview.classes.title")}</h3>
              <Link to="/student/classes" className="text-sm font-bold text-primary hover:underline">{t("studentOverview.classes.viewAll")}</Link>
            </div>

            {classesQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className="h-40 rounded-3xl border-2 border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : (classesQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
                {t("studentOverview.classes.none")}
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
                        {t("studentOverview.classes.subjectsCount", { count: item.activeCourseCount })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground/60">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {t("studentOverview.classes.studentsCount", { count: item.studentCount })}</span>
                      <span>{item.advisor?.name ?? t("studentOverview.classes.advisorPending")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{t("studentOverview.tasks.urgentTitle")}</h3>
              <Link to="/student/submissions" className="text-sm font-bold text-primary hover:underline">{t("studentOverview.tasks.openSubmissions")}</Link>
            </div>
            {homeQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => <div key={index} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : urgentTasks.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentOverview.tasks.noneNow")}</div>
            ) : (
              <ul className="space-y-2">
                {urgentTasks.map((task) => (
                  <li key={`${task.kind}-${task.id}`} className="rounded-2xl border-2 border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{task.title}</p>
                        <p className="text-xs font-medium text-foreground/55">{task.courseTitle ?? t("studentOverview.tasks.courseFallback")}</p>
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
            <h3 className="text-lg font-black">{t("studentOverview.sessions.nextTitle")}</h3>
            {homeQuery.isLoading ? (
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            ) : nextClass ? (
              <div className="rounded-2xl bg-muted/20 p-4">
                <p className="font-black">{nextClass.sessionTitle ?? t("studentOverview.sessions.scheduledFallback")}</p>
                <p className="mt-1 text-sm font-medium text-foreground/60">{nextClass.courseTitle ?? nextClass.groupName ?? t("studentOverview.sessions.academicFallback")}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-foreground/45">
                  {(nextClass.startsAt ?? nextClass.startAt) ? new Date(nextClass.startsAt ?? nextClass.startAt!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : t("studentOverview.sessions.tbd")}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentOverview.sessions.noneScheduled")}</div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <h3 className="text-lg font-black">{t("studentOverview.reminders.title")}</h3>
            {remindersQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((index) => <div key={index} className="h-14 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : reminders.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentOverview.reminders.none")}</div>
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
            <h3 className="text-lg font-black">{t("studentOverview.academicModel.title")}</h3>
            <p className="mt-2 text-sm font-medium text-foreground/60">
              {t("studentOverview.academicModel.body")}
            </p>
            {homeQuery.data?.progress.overdueTasks ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4" />
                  <span>{t("studentOverview.academicModel.overdueNotice", { count: homeQuery.data.progress.overdueTasks })}</span>
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
