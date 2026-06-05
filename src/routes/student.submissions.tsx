import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CheckCircle2, Clock, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/student/submissions")({
  head: () => ({ meta: [{ title: "QuestLMS — Submissions" }] }),
  component: SubmissionsPage,
});

type Status = "graded" | "pending" | "revise";

type Submission = {
  id: string;
  title: string;
  course: string;
  submittedAt: string;
  status: Status;
  grade?: string;
  score?: number;
  max?: number;
  feedback?: string;
};

const data: Submission[] = [
  { id: "s1", title: "Essay: Theories of Memory", course: "Cognitive Psychology", submittedAt: "Jun 4, 2026", status: "graded", grade: "A", score: 92, max: 100, feedback: "Excellent synthesis of Baddeley and Atkinson-Shiffrin. Expand section 3 next time." },
  { id: "s2", title: "Problem Set #7", course: "Calculus", submittedAt: "Jun 3, 2026", status: "graded", grade: "B+", score: 86, max: 100, feedback: "Strong on chain rule. Review implicit differentiation in #5." },
  { id: "s3", title: "Lab Report — Aldehydes", course: "Organic Chemistry II", submittedAt: "Jun 2, 2026", status: "pending" },
  { id: "s4", title: "Reflection Journal", course: "Wellness", submittedAt: "May 30, 2026", status: "graded", grade: "Pass", feedback: "Thoughtful and honest. Keep journaling." },
  { id: "s5", title: "Quiz Retake — Attention", course: "Cognitive Psychology", submittedAt: "May 28, 2026", status: "revise", feedback: "Several misconceptions about divided attention. Revisit lesson 5 and resubmit." },
  { id: "s6", title: "Pre-reading Ch. 4", course: "Modern History", submittedAt: "May 25, 2026", status: "graded", grade: "A-", score: 90, max: 100 },
];

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
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<string | null>("s1");
  const items = data.filter((s) => filter === "all" || s.status === filter);

  const graded = data.filter((s) => s.status === "graded" && s.score && s.max);
  const avg = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.score! / s.max!) * 100, 0) / graded.length)
    : 0;

  return (
    <DashboardShell>
      <TopBar title="My Submissions" subtitle="Track grades and feedback across every assignment" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Submitted", value: data.length },
          { label: "Graded", value: data.filter((s) => s.status === "graded").length },
          { label: "Pending", value: data.filter((s) => s.status === "pending").length },
          { label: "Average", value: `${avg}%` },
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

      <div className="space-y-3">
        {items.map((s) => {
          const meta = statusMeta[s.status];
          const Icon = meta.icon;
          const open = openId === s.id;
          return (
            <article key={s.id} className="bg-card border-2 border-border rounded-2xl chunky-shadow overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : s.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4"
              >
                <span className="size-10 grid place-items-center rounded-xl bg-muted">
                  <FileText className="size-5 text-primary" strokeWidth={2.5} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{s.title}</p>
                  <p className="text-xs font-bold text-foreground/60 mt-0.5">{s.course} · Submitted {s.submittedAt}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${meta.tone}`}>
                  <Icon className="size-3" strokeWidth={3} />
                  {meta.label}
                </span>
                {s.grade && <span className="font-black font-mono text-lg w-10 text-right">{s.grade}</span>}
                <ChevronRight className={`size-4 text-foreground/40 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>
              {open && (
                <div className="border-t-2 border-border p-5 bg-muted/30">
                  {s.score != null && s.max != null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Score</span>
                        <span className="font-mono">{s.score}/{s.max}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(s.score / s.max) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {s.feedback ? (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">Instructor feedback</p>
                      <p className="text-sm font-medium leading-relaxed">{s.feedback}</p>
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
    </DashboardShell>
  );
}
