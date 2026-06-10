import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, AlertCircle, AlarmClock, FileText, ChevronRight, Paperclip } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useStudentPortalTasks, type StudentPortalTask } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/submissions")({
  head: () => ({ meta: [{ title: "QuestLMS — Submissions" }] }),
  component: SubmissionsPage,
});

type Status = "graded" | "pending" | "overdue" | "revise";

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "graded", label: "Graded" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "revise", label: "Needs revision" },
];

const STATUS_META: Record<Status, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  graded:  { label: "Graded",        icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  pending: { label: "Pending",       icon: Clock,        tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  overdue: { label: "Overdue",       icon: AlarmClock,   tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  revise:  { label: "Needs revision",icon: AlertCircle,  tone: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
};

const MOCK_TASKS: StudentPortalTask[] = [
  {
    id: 1, kind: "homework", sessionId: 1, courseId: 1, groupId: null,
    title: "Essay: Theories of Memory", description: null,
    courseTitle: "Cognitive Psychology", sessionTitle: "Week 3",
    dueAt: "2026-06-01T23:59:00.000Z", status: "graded",
    submission: { id: 1, submittedAt: "2026-06-01T14:30:00.000Z", score: 88, reviewComment: "Great analysis of Baddeley's model. Your comparison of working memory components was especially clear.", answerText: "Memory can be classified into several types including short-term, long-term, and working memory...", attachmentUrl: null, status: "graded" },
    attempt: null,
  },
  {
    id: 2, kind: "activity", sessionId: 2, courseId: 2, groupId: null,
    title: "Problem Set #7", description: null,
    courseTitle: "Organic Chemistry II", sessionTitle: "Week 5",
    dueAt: "2026-06-03T23:59:00.000Z", status: "needs_revision",
    submission: { id: 2, submittedAt: "2026-06-03T20:00:00.000Z", score: 62, reviewComment: "Good attempt but review the nucleophilic substitution mechanisms in sections 3–4.", answerText: null, attachmentUrl: null, status: "needs_revision" },
    attempt: null,
  },
  {
    id: 3, kind: "homework", sessionId: 3, courseId: 2, groupId: null,
    title: "Lab Report — Aldehydes", description: null,
    courseTitle: "Organic Chemistry II", sessionTitle: "Week 6",
    dueAt: "2026-06-07T23:59:00.000Z", status: "submitted",
    submission: { id: 3, submittedAt: "2026-06-07T22:15:00.000Z", score: null, reviewComment: null, answerText: null, attachmentUrl: "https://example.com/lab-report.pdf", status: "submitted" },
    attempt: null,
  },
  {
    id: 4, kind: "homework", sessionId: 4, courseId: 1, groupId: null,
    title: "Reflection Journal", description: null,
    courseTitle: "Cognitive Psychology", sessionTitle: "Week 4",
    dueAt: "2026-06-05T23:59:00.000Z", status: "overdue",
    submission: null, attempt: null,
  },
  {
    id: 5, kind: "homework", sessionId: 5, courseId: 2, groupId: null,
    title: "Pre-reading Ch. 4", description: null,
    courseTitle: "Organic Chemistry II", sessionTitle: "Week 7",
    dueAt: "2026-06-12T23:59:00.000Z", status: "open",
    submission: null, attempt: null,
  },
];

function SubmissionsPage() {
  const tasksQuery = useStudentPortalTasks();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const allTasks = useMemo(() => {
    const source = tasksQuery.data ?? MOCK_TASKS;
    return source.filter((t) => t.kind !== "quiz");
  }, [tasksQuery.data]);

  const items = allTasks.filter((t) => filter === "all" || classifyStatus(t) === filter);

  const counts = useMemo(() => {
    const scored = allTasks.filter((t) => classifyStatus(t) === "graded" && t.submission?.score != null);
    return {
      total:   allTasks.length,
      graded:  allTasks.filter((t) => classifyStatus(t) === "graded").length,
      pending: allTasks.filter((t) => classifyStatus(t) === "pending").length,
      overdue: allTasks.filter((t) => classifyStatus(t) === "overdue").length,
      revise:  allTasks.filter((t) => classifyStatus(t) === "revise").length,
      avg:     scored.length ? Math.round(scored.reduce((s, t) => s + Number(t.submission!.score), 0) / scored.length) : null,
    };
  }, [allTasks]);

  return (
    <DashboardShell>
      <TopBar title="My Submissions" subtitle="Track your grades and feedback across every assignment" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {([
          { label: "Total",          value: counts.total,                            warn: false },
          { label: "Graded",         value: counts.graded,                           warn: false },
          { label: "Pending",        value: counts.pending,                          warn: false },
          { label: "Needs revision", value: counts.revise,                           warn: counts.revise > 0 },
          { label: "Average",        value: counts.avg != null ? `${counts.avg} pts` : "N/A", warn: false },
        ] as const).map((s) => (
          <div key={s.label} className={`border-2 rounded-2xl p-4 chunky-shadow ${s.warn ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" : "bg-card border-border"}`}>
            <p className={`text-xs font-black uppercase tracking-wider ${s.warn ? "text-amber-600 dark:text-amber-400" : "text-foreground/50"}`}>{s.label}</p>
            <p className={`text-2xl font-black font-mono mt-1 ${s.warn ? "text-amber-700 dark:text-amber-300" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary chunky-shadow"
                : "bg-card border-border hover:-translate-y-0.5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {tasksQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-bold text-foreground/50">No submissions match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((task) => {
            const status = classifyStatus(task);
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const open = openId === task.id;
            return (
              <article key={`${task.kind}-${task.id}`} className="bg-card border-2 border-border rounded-2xl chunky-shadow overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : task.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <span className="size-10 grid place-items-center rounded-xl bg-muted shrink-0">
                    <FileText className="size-5 text-primary" strokeWidth={2.5} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{task.title}</p>
                    <p className="text-xs font-bold text-foreground/60 mt-0.5">
                      {task.courseTitle ?? "Course"}
                      {task.submission?.submittedAt
                        ? ` · Submitted ${new Date(task.submission.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                        : task.dueAt
                          ? ` · Due ${new Date(task.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                          : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${meta.tone}`}>
                    <Icon className="size-3" strokeWidth={3} />
                    {meta.label}
                  </span>
                  {task.submission?.score != null && (
                    <span className="shrink-0 font-black font-mono text-base text-right w-16">{task.submission.score} pts</span>
                  )}
                  <ChevronRight className={`size-4 text-foreground/40 transition-transform shrink-0 ${open ? "rotate-90" : ""}`} />
                </button>

                {open && (
                  <div className="border-t-2 border-border p-5 bg-muted/30 space-y-4">
                    {/* Score */}
                    {task.submission?.score != null && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-1">Score</p>
                        <p className="text-3xl font-black font-mono">
                          {task.submission.score} <span className="text-base font-bold text-foreground/40">pts</span>
                        </p>
                      </div>
                    )}

                    {/* Instructor feedback */}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-1">Instructor feedback</p>
                      {task.submission?.reviewComment ? (
                        <p className="text-sm font-medium leading-relaxed">{task.submission.reviewComment}</p>
                      ) : (
                        <p className="text-sm font-medium text-foreground/50">Awaiting feedback from your instructor.</p>
                      )}
                    </div>

                    {/* Student's submitted answer */}
                    {task.submission?.answerText && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-1">Your answer</p>
                        <p className="text-sm font-medium leading-relaxed text-foreground/80 bg-background rounded-xl p-3 border border-border">
                          {task.submission.answerText}
                        </p>
                      </div>
                    )}

                    {/* Attachment */}
                    {task.submission?.attachmentUrl && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-1">Attachment</p>
                        <a
                          href={task.submission.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                        >
                          <Paperclip className="size-4" />
                          View submitted file
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function classifyStatus(task: StudentPortalTask): Status {
  if (task.status === "needs_revision") return "revise";
  if (["approved", "completed", "graded"].includes(task.status) || task.submission?.score != null) return "graded";
  if (task.status === "overdue") return "overdue";
  return "pending";
}
