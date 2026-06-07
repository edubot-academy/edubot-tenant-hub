import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import { useStudentPortalTasks, type StudentPortalTask } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/submissions")({
  head: () => ({ meta: [{ title: "QuestLMS — Submissions" }] }),
  component: SubmissionsPage,
});

type Status = "graded" | "pending" | "revise";

const filters: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "graded", label: "Graded" },
  { key: "pending", label: "Pending" },
  { key: "revise", label: "Revise" },
];

const statusMeta: Record<Status, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  graded: { label: "Graded", icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  pending: { label: "Pending", icon: Clock, tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  revise: { label: "Needs revision", icon: AlertCircle, tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};

function SubmissionsPage() {
  const { context } = useAppContext();
  const tasksQuery = useStudentPortalTasks();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const submissionTasks = useMemo(() => (tasksQuery.data ?? []).filter((task) => task.kind !== "quiz"), [tasksQuery.data]);
  const items = submissionTasks.filter((task) => filter === "all" || classifySubmissionStatus(task) === filter);

  const graded = submissionTasks.filter((task) => classifySubmissionStatus(task) === "graded" && task.submission?.score != null);
  const avg = graded.length
    ? Math.round(graded.reduce((sum, task) => sum + Number(task.submission?.score ?? 0), 0) / graded.length)
    : 0;

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="My Submissions" subtitle="Track grades and feedback across every assignment" />
        <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses local submission data.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <TopBar title="My Submissions" subtitle="Track grades and feedback across every assignment" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Submitted", value: submissionTasks.length },
          { label: "Graded", value: submissionTasks.filter((task) => classifySubmissionStatus(task) === "graded").length },
          { label: "Pending", value: submissionTasks.filter((task) => classifySubmissionStatus(task) === "pending").length },
          { label: "Average", value: graded.length ? `${avg}%` : "N/A" },
        ].map((s) => (
          <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.label}</p>
            <p className="text-2xl font-black font-mono mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
              filter === f.key ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tasksQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => <div key={index} className="h-24 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
          No submissions found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((task) => {
            const status = classifySubmissionStatus(task);
            const meta = statusMeta[status];
            const Icon = meta.icon;
            const open = openId === task.id;
            return (
              <article key={`${task.kind}-${task.id}`} className="bg-card border-2 border-border rounded-2xl chunky-shadow overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : task.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <span className="size-10 grid place-items-center rounded-xl bg-muted">
                    <FileText className="size-5 text-primary" strokeWidth={2.5} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{task.title}</p>
                    <p className="text-xs font-bold text-foreground/60 mt-0.5">
                      {task.courseTitle ?? "Course"} · {task.submission?.submittedAt ?? task.dueAt ?? "Pending"}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${meta.tone}`}>
                    <Icon className="size-3" strokeWidth={3} />
                    {meta.label}
                  </span>
                  {task.submission?.score != null && <span className="font-black font-mono text-lg w-12 text-right">{task.submission.score}</span>}
                  <ChevronRight className={`size-4 text-foreground/40 transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && (
                  <div className="border-t-2 border-border p-5 bg-muted/30">
                    {task.submission?.score != null && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>Score</span>
                          <span className="font-mono">{task.submission.score}/100</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${task.submission.score}%` }} />
                        </div>
                      </div>
                    )}
                    {task.submission?.reviewComment ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">Instructor feedback</p>
                        <p className="text-sm font-medium leading-relaxed">{task.submission.reviewComment}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-foreground/60">Awaiting feedback from your instructor.</p>
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

function classifySubmissionStatus(task: StudentPortalTask): Status {
  if (task.status === "needs_revision") return "revise";
  if (["approved", "completed", "graded"].includes(task.status) || task.submission?.score != null) return "graded";
  return "pending";
}
