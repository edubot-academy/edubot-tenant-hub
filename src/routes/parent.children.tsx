import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CalendarClock, GraduationCap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentChildren, useParentChildSummary } from "@/lib/parent-portal-api";
import type { ParentChildSummary } from "@/lib/parent-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/parent/children")({
  head: () => ({ meta: [{ title: i18n.t("parentChildren.meta.title") }] }),
  component: ParentChildrenPage,
});

function ParentChildrenPage() {
  const { t } = useTranslation();
  const childrenQuery = useParentChildren();
  const children = childrenQuery.data ?? [];

  return (
    <DashboardShell>
      <TopBar title={t("parentChildren.topbar.title")} subtitle={t("parentChildren.topbar.subtitle")} showStreak={false} />

      {childrenQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((index) => <div key={index} className="h-72 rounded-3xl border-2 border-border bg-card animate-pulse" />)}
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <p className="font-black">{t("parentChildren.empty.title")}</p>
          <p className="text-sm text-foreground/60 mt-2">{t("parentChildren.empty.body")}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-foreground/60 font-medium">{t("parentChildren.linkedCount", { count: children.length })}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <ChildCard key={child.studentId} child={child} />
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function ChildCard({ child }: { child: ParentChildSummary }) {
  const { t, i18n: i18next } = useTranslation();
  const detailQuery = useParentChildSummary(child.studentId);

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(i18next.language, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <article className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-5">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-lg">
          {initials(child.fullName ?? child.email ?? t("parentChildren.avatarFallback"))}
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-xl leading-tight truncate">{child.fullName ?? child.email ?? t("parentChildren.studentFallback", { id: child.studentId })}</h3>
          <p className="text-xs text-foreground/55 font-medium">{child.primaryLabel ?? t("parentChildren.linkedLearner")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("parentChildren.progress")} value={`${child.progressPercent}%`} icon={<GraduationCap className="size-4 text-primary" />} />
        <Stat label={t("parentChildren.attendance")} value={child.attendanceRate == null ? t("parentChildren.notAvailable") : `${child.attendanceRate}%`} icon={<Users className="size-4 text-primary" />} />
        <Stat label={t("parentChildren.courses")} value={child.activeCourseCount} />
        <Stat label={t("parentChildren.certificates")} value={child.certificatesIssued} icon={<Award className="size-4 text-primary" />} />
      </div>

      <div className="rounded-2xl bg-muted/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/50">
          <CalendarClock className="size-3.5" />
          {t("parentChildren.nextSession")}
        </div>
        <div className="font-bold text-sm">{child.nextSessionTitle ?? t("parentChildren.noUpcomingSession")}</div>
        <div className="text-xs text-foreground/60">
          {child.nextSessionAt ? formatDateTime(child.nextSessionAt) : t("parentChildren.scheduleNotAvailable")}
        </div>
      </div>

      {detailQuery.data?.home.urgentTasks?.length ? (
        <div className="rounded-2xl border-2 border-border p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("parentChildren.urgentTasks")}</div>
          <div className="mt-2 text-sm font-bold">{detailQuery.data.home.urgentTasks[0]?.title}</div>
          <div className="text-xs text-foreground/60 mt-1">
            {detailQuery.data.home.urgentTasks[0]?.dueAt
              ? formatDateTime(detailQuery.data.home.urgentTasks[0].dueAt)
              : t("parentChildren.dueDateNotSet")}
          </div>
        </div>
      ) : null}

      <Link to="/parent" className="block w-full py-2.5 rounded-2xl bg-muted hover:bg-foreground/5 transition-colors font-bold text-sm text-center">
        {t("parentChildren.openDashboard")}
      </Link>
    </article>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-muted/50">
      <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-black font-mono text-lg mt-1">{value}</div>
    </div>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CH";
}
