import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, FileText, Calendar, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "@/lib/i18n";
import { useInstructorAssignments, type AssignmentItem } from "@/lib/instructor/instructor-grading-api";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/assignments")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorAssignments.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Assignments",
        }),
      },
    ],
  }),
  component: AssignmentsPage,
});

type SeedAssignment = { id: string; title: string; cls: string; due: string; points: number; submitted: number; total: number; status: "draft" | "live" | "closed"; type: string };

const seed: SeedAssignment[] = [
  { id: "a1", title: "Essay: Theories of Memory", cls: "Cog. Psych", due: "Jun 14", points: 100, submitted: 86, total: 124, status: "live", type: "Essay" },
  { id: "a2", title: "Problem Set #8", cls: "Calculus", due: "Jun 16", points: 50, submitted: 42, total: 142, status: "live", type: "Worksheet" },
  { id: "a3", title: "Lab Report — Aldehydes", cls: "Org. Chem II", due: "Jun 20", points: 80, submitted: 12, total: 86, status: "live", type: "Lab" },
  { id: "a4", title: "Final Project Proposal", cls: "Cog. Psych", due: "Jul 02", points: 25, submitted: 0, total: 124, status: "draft", type: "Project" },
  { id: "a5", title: "Quiz: Attention Models", cls: "Cog. Psych", due: "Jun 05", points: 20, submitted: 120, total: 124, status: "closed", type: "Quiz" },
];

const statusTone = {
  draft: "bg-muted text-foreground/60",
  live: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const ALL_SENTINEL = "__ALL__";

function AssignmentsPage() {
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  if (isBackend) return <BackendAssignmentsPage />;
  return <PrototypeAssignmentsPage />;
}

function BackendAssignmentsPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const assignmentsQuery = useInstructorAssignments();
  const items = assignmentsQuery.data?.items ?? [];
  const total = assignmentsQuery.data?.total ?? 0;
  const groups = useMemo(() => {
    return Array.from(new Set(items.map((a) => a.groupName).filter(Boolean))) as string[];
  }, [items]);
  const [groupFilter, setGroupFilter] = useState<string>(ALL_SENTINEL);

  const filtered = useMemo(() => {
    if (groupFilter === ALL_SENTINEL) return items;
    return items.filter((a) => a.groupName === groupFilter);
  }, [items, groupFilter]);

  const pendingTotal = filtered.reduce((sum, a) => sum + a.pendingCount, 0);

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorAssignments.topbar.title", { defaultValue: "Assignments" })}
        subtitle={t("instructorAssignments.topbar.subtitleBackend", { defaultValue: "Homework across all your groups" })}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {[
          { l: t("instructorAssignments.metrics.total", { defaultValue: "Total" }), v: total },
          { l: t("instructorAssignments.metrics.pendingReview", { defaultValue: "Pending review" }), v: pendingTotal },
          { l: t("instructorAssignments.metrics.groups", { defaultValue: "Groups" }), v: groups.length },
        ].map((s) => (
          <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
            <p className="text-2xl font-black font-mono mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setGroupFilter(ALL_SENTINEL)}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${groupFilter === ALL_SENTINEL ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}
        >
          {t("instructorAssignments.filters.all", { defaultValue: "All" })}
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${groupFilter === g ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}
          >
            {g}
          </button>
        ))}
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="space-y-3" aria-label={t("instructorAssignments.state.loading", { defaultValue: "Loading assignments…" })}>
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl border-2 border-border bg-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorAssignments.empty.noneFound", { defaultValue: "No assignments found." })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => <AssignmentRow key={a.id} item={a} language={activeI18n.language} />)}
        </div>
      )}
    </DashboardShell>
  );
}

function AssignmentRow({ item: a, language }: { item: AssignmentItem; language: string }) {
  const { t } = useTranslation();
  const statusKey = a.isPublished ? "live" : "draft";
  const dueLabel = a.dueAt
    ? new Date(a.dueAt).toLocaleDateString(language, { month: "short", day: "numeric" })
    : t("instructorAssignments.labels.noDueDate", { defaultValue: "No due date" });
  const submittedPct = a.enrolledCount > 0
    ? Math.round((a.submittedCount / a.enrolledCount) * 100)
    : 0;

  return (
    <Link
      to="/instructor/sessions/$sessionId/homework/$homeworkId"
      params={{ sessionId: String(a.sessionId), homeworkId: String(a.id) }}
      className="block bg-card border-2 border-border rounded-2xl p-5 chunky-shadow flex flex-col md:flex-row md:items-center gap-4 hover:-translate-y-0.5 transition-transform"
    >
      <span className="size-12 grid place-items-center rounded-2xl bg-muted shrink-0">
        <FileText className="size-5 text-primary" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-base">{a.title}</h3>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${statusTone[statusKey]}`}>
            {t(`instructorAssignments.status.${statusKey}`, { defaultValue: statusKey })}
          </span>
        </div>
        <p className="text-xs font-bold text-foreground/60 mt-1">
          {a.groupName} · {a.courseTitle}
        </p>
      </div>
      <div className="flex items-center gap-5 text-xs font-bold text-foreground/70 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3.5" />{dueLabel}
        </span>
        {a.maxScore !== null && (
          <span className="font-mono">{t("instructorAssignments.labels.points", { count: a.maxScore, defaultValue: "{{count}} pts" })}</span>
        )}
        <span className="inline-flex items-center gap-2 min-w-[140px]">
          <Users className="size-3.5" />
          <span className="h-2 w-16 bg-muted rounded-full overflow-hidden">
            <span className="block h-full bg-primary" style={{ width: `${submittedPct}%` }} />
          </span>
          <span className="font-mono">
            {t("instructorAssignments.labels.submittedPending", { submitted: a.submittedCount, pending: a.pendingCount, defaultValue: "{{submitted}} submitted · {{pending}} pending" })}
          </span>
        </span>
      </div>
    </Link>
  );
}

function PrototypeAssignmentsPage() {
  const { t } = useTranslation();
  const tabs = [
    { key: "all", label: t("instructorAssignments.filters.all", { defaultValue: "All" }) },
    { key: "draft", label: t("instructorAssignments.status.draftPlural", { defaultValue: "Drafts" }) },
    { key: "live", label: t("instructorAssignments.status.live", { defaultValue: "Live" }) },
    { key: "closed", label: t("instructorAssignments.status.closed", { defaultValue: "Closed" }) },
  ] as const;
  type Tab = (typeof tabs)[number]["key"];
  const [tab, setTab] = useState<Tab>("all");
  const items = seed.filter((a) => tab === "all" || a.status === tab);

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorAssignments.topbar.title", { defaultValue: "Assignments" })}
        subtitle={t("instructorAssignments.topbar.subtitlePrototype", { defaultValue: "Create and track work across all your classes" })}
      />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${tab === t.key ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}>{t.label}</button>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform">
          <Plus className="size-4" strokeWidth={3} /> {t("instructorAssignments.actions.new", { defaultValue: "New assignment" })}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <article key={a.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow flex flex-col md:flex-row md:items-center gap-4">
            <span className="size-12 grid place-items-center rounded-2xl bg-muted shrink-0"><FileText className="size-5 text-primary" strokeWidth={2.5} /></span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base">{a.title}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${statusTone[a.status]}`}>{t(`instructorAssignments.status.${a.status}`, { defaultValue: a.status })}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{a.type}</span>
              </div>
              <p className="text-xs font-bold text-foreground/60 mt-1">{a.cls}</p>
            </div>
            <div className="flex items-center gap-5 text-xs font-bold text-foreground/70">
              <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{t("instructorAssignments.labels.due", { date: a.due, defaultValue: "Due {{date}}" })}</span>
              <span className="font-mono">{t("instructorAssignments.labels.points", { count: a.points, defaultValue: "{{count}} pts" })}</span>
              <span className="inline-flex items-center gap-2 min-w-[120px]">
                <Users className="size-3.5" />
                <span className="h-2 w-16 bg-muted rounded-full overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${(a.submitted / a.total) * 100}%` }} /></span>
                <span className="font-mono">{a.submitted}/{a.total}</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
