import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { UsersTable } from "@/components/admin/UsersTable";
import { ReportsCharts } from "@/components/admin/ReportsCharts";
import { CourseCatalog } from "@/components/admin/CourseCatalog";
import { IntegrationHub } from "@/components/admin/IntegrationHub";
import { AuditLog } from "@/components/admin/AuditLog";
import { BrandingPanel } from "@/components/admin/BrandingPanel";
import { BillingUsage } from "@/components/admin/BillingUsage";
import { ApiKeysPanel } from "@/components/admin/ApiKeysPanel";
import { BookOpen, CalendarClock, CheckCircle2, Clock3, Layers, Users } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useCompanyAdminDashboard } from "@/lib/company-admin/company-dashboard-api";

export const Route = createFileRoute("/company-admin")({
  head: () => ({ meta: [{ title: "QuestLMS — Company Admin" }] }),
  component: CompanyAdminRoot,
});

function CompanyAdminRoot() {
  const { pathname } = useLocation();
  if (pathname === "/company-admin" || pathname === "/company-admin/") return <Navigate to="/" replace />;
  return <Outlet />;
}

export function CompanyAdminDashboard() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useCompanyAdminDashboard();

  const stats = data?.stats;

  return (
    <DashboardShell>
      <TopBar />
      <Link
        to="/company-admin/hierarchy"
        className="flex items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-foreground/20 transition-colors mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="font-black text-base">{t("companyAdminDashboardPage.hierarchy.title")}</p>
            <p className="text-xs text-foreground/60">{t("companyAdminDashboardPage.hierarchy.subtitle")}</p>
          </div>
        </div>
        <span className="text-xs font-black text-primary">{t("companyAdminDashboardPage.hierarchy.cta")}</span>
      </Link>

      {backendEnabled ? (
        <section className="grid grid-cols-12 gap-4">
          {isLoading && (
            <div className="col-span-12 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
              {t("companyAdminDashboardPage.state.loading")}
            </div>
          )}
          {isError && (
            <div className="col-span-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {t("companyAdminDashboardPage.state.error")}
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <StatsCard
                title={t("companyAdminDashboardPage.stats.courses")}
                value={String(stats?.courses ?? 0)}
                subtitle={t("companyAdminDashboardPage.stats.coursesSubtitle", {
                  published: stats?.publishedCourses ?? 0,
                  drafts: stats?.draftCourses ?? 0,
                })}
                icon={BookOpen}
              />
              <StatsCard
                title={t("companyAdminDashboardPage.stats.members")}
                value={String(stats?.members ?? 0)}
                subtitle={t("companyAdminDashboardPage.stats.membersSubtitle", {
                  students: stats?.students ?? 0,
                })}
                icon={Users}
              />
              <StatsCard
                title={t("companyAdminDashboardPage.stats.sessions")}
                value={String(stats?.todaySessions ?? 0)}
                subtitle={t("companyAdminDashboardPage.stats.sessionsSubtitle", {
                  upcoming: stats?.upcomingSessions ?? 0,
                })}
                icon={CalendarClock}
              />
              <StatsCard
                title={t("companyAdminDashboardPage.stats.attendance")}
                value={stats?.attendanceRate != null ? `${stats.attendanceRate}%` : "—"}
                subtitle={t("companyAdminDashboardPage.stats.attendanceSubtitle", {
                  unmarked: data.sessions.unmarkedAttendance,
                })}
                icon={CheckCircle2}
              />

              <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminDashboardPage.setup.title")}
                  </h3>
                  <span className="text-xs font-mono text-foreground/50">{data.setup.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
                  <div className="h-full bg-primary" style={{ width: `${data.setup.progress}%` }} />
                </div>
                <ul className="space-y-3">
                  {data.setup.items.map((item) => (
                    <li key={item.label} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold">{item.label}</div>
                          <div className="text-xs text-foreground/55 mt-1">{item.hint}</div>
                        </div>
                        <div className="text-xs font-mono text-foreground/60 text-right">{item.value}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminDashboardPage.courses.title")}
                  </h3>
                  <span className="text-xs font-mono text-foreground/50">
                    {t("companyAdminDashboardPage.courses.count", { count: data.courses.length })}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{course.title}</div>
                        <div className="text-xs text-foreground/55 mt-1">
                          {course.courseType ?? "course"} · {course.enrolledStudents ?? 0} {t("companyAdminDashboardPage.courses.students")}
                        </div>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                        {course.isPublished
                          ? t("companyAdminDashboardPage.courses.published")
                          : t("companyAdminDashboardPage.courses.draft")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminDashboardPage.upcoming.title")}
                  </h3>
                  <span className="text-xs font-mono text-foreground/50">
                    {data.sessions.upcoming.length}
                  </span>
                </div>
                {data.sessions.upcoming.length ? (
                  <div className="space-y-3">
                    {data.sessions.upcoming.map((session) => (
                      <div key={session.id} className="rounded-xl border border-border p-3">
                        <div className="text-sm font-bold">{session.title}</div>
                        <div className="text-xs text-foreground/55 mt-1">
                          {formatDateTime(session.startsAt)} · {session.groupName ?? session.courseTitle ?? t("companyAdminDashboardPage.upcoming.noGroup")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">{t("companyAdminDashboardPage.upcoming.empty")}</p>
                )}
              </section>

              <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("companyAdminDashboardPage.activity.title")}
                  </h3>
                  <Clock3 className="size-4 text-foreground/40" />
                </div>
                {data.activity.length ? (
                  <div className="space-y-3">
                    {data.activity.map((item, index) => (
                      <div key={String(item.id ?? index)} className="rounded-xl border border-border p-3">
                        <div className="text-sm font-bold">{item.actorFullName ?? item.actorEmail ?? t("companyAdminDashboardPage.activity.system")}</div>
                        <div className="text-xs text-foreground/55 mt-1">
                          {item.action ?? t("companyAdminDashboardPage.activity.updated")} · {item.targetType ?? t("companyAdminDashboardPage.activity.workspace")}
                        </div>
                        <div className="text-[11px] font-mono text-foreground/45 mt-2">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">{t("companyAdminDashboardPage.activity.empty")}</p>
                )}
              </section>
            </>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-12 gap-4">
          <ReportsCharts />
          <BrandingPanel />
          <BillingUsage />
          <UsersTable />
          <CourseCatalog />
          <ApiKeysPanel />
          <IntegrationHub />
          <AuditLog />
        </section>
      )}
    </DashboardShell>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof BookOpen;
}) {
  return (
    <section className="col-span-12 sm:col-span-6 xl:col-span-3 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/55">{title}</div>
          <div className="text-2xl font-black mt-2">{value}</div>
          <div className="text-xs text-foreground/55 mt-2">{subtitle}</div>
        </div>
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="size-5" />
        </div>
      </div>
    </section>
  );
}
