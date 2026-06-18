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
import { useAdminDashboard } from "@/lib/company-admin/company-dashboard-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/company-admin")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("roles.company_admin")}` }] }),
  component: CompanyAdminRoot,
});

function CompanyAdminRoot() {
  const { pathname } = useLocation();
  if (pathname === "/company-admin" || pathname === "/company-admin/") return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AdminDashboard() {
  const { t, i18n: activeI18n } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useAdminDashboard();

  const stats = data?.stats;
  const locale = activeI18n.resolvedLanguage || activeI18n.language;

  const formatActivityAction = (action?: string | null) => {
    if (!action) return t("dashboardPage.activity.updated");
    return getActivityActionLabel(action, locale);
  };

  const formatActivityTarget = (targetType?: string | null) => {
    if (!targetType) return t("dashboardPage.activity.workspace");
    return getActivityTargetLabel(targetType, locale);
  };

  return (
    <DashboardShell>
      <TopBar />
      <Link
        to="/hierarchy"
        className="flex items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-foreground/20 transition-colors mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="font-black text-base">{t("dashboardPage.hierarchy.title")}</p>
            <p className="text-xs text-foreground/60">{t("dashboardPage.hierarchy.subtitle")}</p>
          </div>
        </div>
        <span className="text-xs font-black text-primary">{t("dashboardPage.hierarchy.cta")}</span>
      </Link>

      {backendEnabled ? (
        <section className="grid grid-cols-12 gap-4">
          {isLoading && (
            <div className="col-span-12 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
              {t("dashboardPage.state.loading")}
            </div>
          )}
          {isError && (
            <div className="col-span-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {t("dashboardPage.state.error")}
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <StatsCard
                title={t("dashboardPage.stats.courses")}
                value={String(stats?.courses ?? 0)}
                subtitle={t("dashboardPage.stats.coursesSubtitle", {
                  published: stats?.publishedCourses ?? 0,
                  drafts: stats?.draftCourses ?? 0,
                })}
                icon={BookOpen}
              />
              <StatsCard
                title={t("dashboardPage.stats.members")}
                value={String(stats?.members ?? 0)}
                subtitle={t("dashboardPage.stats.membersSubtitle", {
                  students: stats?.students ?? 0,
                })}
                icon={Users}
              />
              <StatsCard
                title={t("dashboardPage.stats.sessions")}
                value={String(stats?.todaySessions ?? 0)}
                subtitle={t("dashboardPage.stats.sessionsSubtitle", {
                  upcoming: stats?.upcomingSessions ?? 0,
                })}
                icon={CalendarClock}
              />
              <StatsCard
                title={t("dashboardPage.stats.attendance")}
                value={stats?.attendanceRate != null ? `${stats.attendanceRate}%` : "—"}
                subtitle={t("dashboardPage.stats.attendanceSubtitle", {
                  unmarked: data.sessions.unmarkedAttendance,
                })}
                icon={CheckCircle2}
              />

              <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("dashboardPage.setup.title")}
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
                    {t("dashboardPage.courses.title")}
                  </h3>
                  <span className="text-xs font-mono text-foreground/50">
                    {t("dashboardPage.courses.count", { count: data.courses.length })}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.courses.map((course) => (
                    <Link
                      key={course.id}
                      to="/courses/$courseId"
                      params={{ courseId: String(course.id) }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 hover:border-foreground/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{course.title}</div>
                        <div className="text-xs text-foreground/55 mt-1">
                          {course.courseType ?? t("nav.courses")} · {course.enrolledStudents ?? 0} {t("dashboardPage.courses.students")}
                        </div>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                        {course.isPublished
                          ? t("dashboardPage.courses.published")
                          : t("dashboardPage.courses.draft")}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("dashboardPage.upcoming.title")}
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
                          {formatDateTime(session.startsAt, locale)} · {session.groupName ?? session.courseTitle ?? t("dashboardPage.upcoming.noGroup")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">{t("dashboardPage.upcoming.empty")}</p>
                )}
              </section>

              <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("dashboardPage.activity.title")}
                  </h3>
                  <Clock3 className="size-4 text-foreground/40" />
                </div>
                {data.activity.length ? (
                  <div className="space-y-3">
                    {data.activity.map((item, index) => (
                      <div key={String(item.id ?? index)} className="rounded-xl border border-border p-3">
                        <div className="text-sm font-bold">{item.actorFullName ?? item.actorEmail ?? t("dashboardPage.activity.system")}</div>
                        <div className="text-xs text-foreground/55 mt-1">
                          {formatActivityAction(item.action)} · {formatActivityTarget(item.targetType)}
                        </div>
                        <div className="text-[11px] font-mono text-foreground/45 mt-2">
                          {formatDateTime(item.createdAt, locale)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">{t("dashboardPage.activity.empty")}</p>
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

function formatDateTime(value?: string | null, locale?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActivityActionLabel(action: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    "tenant.settings_updated": {
      ky: "Жөндөөлөр жаңыртылды",
      ru: "Настройки обновлены",
      en: "Settings updated",
    },
    "tenant.updated": {
      ky: "Иш мейкиндиги жаңыртылды",
      ru: "Рабочая область обновлена",
      en: "Workspace updated",
    },
    "tenant.member_invited": {
      ky: "Колдонуучу чакырылды",
      ru: "Пользователь приглашён",
      en: "Member invited",
    },
    "tenant.member_updated": {
      ky: "Колдонуучу жаңыртылды",
      ru: "Пользователь обновлён",
      en: "Member updated",
    },
    "tenant.course_updated": {
      ky: "Курс жаңыртылды",
      ru: "Курс обновлён",
      en: "Course updated",
    },
  };

  return labels[action]?.[normalizeLocale(locale)] ?? labels[action]?.en ?? humanizeKey(action);
}

function getActivityTargetLabel(targetType: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    tenant: {
      ky: "Иш мейкиндиги",
      ru: "Рабочая область",
      en: "Workspace",
    },
    user: {
      ky: "Колдонуучу",
      ru: "Пользователь",
      en: "User",
    },
    course: {
      ky: "Курс",
      ru: "Курс",
      en: "Course",
    },
    billing: {
      ky: "Төлөмдөр",
      ru: "Биллинг",
      en: "Billing",
    },
    settings: {
      ky: "Жөндөөлөр",
      ru: "Настройки",
      en: "Settings",
    },
  };

  return labels[targetType]?.[normalizeLocale(locale)] ?? labels[targetType]?.en ?? humanizeKey(targetType);
}

function normalizeLocale(locale: string) {
  return locale.split("-")[0] || "en";
}

function humanizeKey(value: string) {
  return value
    .replace(/^tenant\./, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
