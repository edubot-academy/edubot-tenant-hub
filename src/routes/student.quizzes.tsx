import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuizArenaCard } from "@/components/student/QuizArenaCard";
import { CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";

export const Route = createFileRoute("/student/quizzes")({
  head: () => ({ meta: [{ title: "QuestLMS — Quizzes" }] }),
  component: StudentQuizzesPage,
});

const history = [
  { id: "q1", title: "Attention models", course: "Cognitive Psychology", score: 92, total: 100, status: "passed" as const, date: "Yesterday" },
  { id: "q2", title: "Nucleophilic substitution", course: "Organic Chemistry II", score: 71, total: 100, status: "passed" as const, date: "2d ago" },
  { id: "q3", title: "Working memory pop quiz", course: "Cognitive Psychology", score: 48, total: 100, status: "failed" as const, date: "5d ago" },
  { id: "q4", title: "Stereochemistry basics", course: "Organic Chemistry II", score: 85, total: 100, status: "passed" as const, date: "1w ago" },
];

const upcoming = [
  { id: "u1", title: "Memory theories — chapter quiz", course: "Cognitive Psychology", when: "Tomorrow, 10:00" },
  { id: "u2", title: "Lab safety refresher", course: "Organic Chemistry II", when: "Fri, 14:00" },
];

function StudentQuizzesPage() {
  return (
    <DashboardShell>
      <TopBar title="Quizzes" subtitle="Live battles, upcoming tests, and your past attempts." showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <QuizArenaCard />
        </div>
        <section className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Clock className="size-5 text-primary" strokeWidth={2.5} /> Upcoming
          </h3>
          <ul className="divide-y divide-border">
            {upcoming.map((u) => (
              <li key={u.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold truncate">{u.title}</p>
                  <p className="text-xs text-foreground/50 font-medium">{u.course}</p>
                </div>
                <span className="text-xs font-bold text-primary font-mono shrink-0">{u.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" strokeWidth={2.5} /> Past attempts
        </h3>
        <div className="space-y-2">
          {history.map((h) => {
            const passed = h.status === "passed";
            return (
              <div
                key={h.id}
                className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {passed ? (
                    <CheckCircle2 className="size-5 text-success shrink-0" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="size-5 text-destructive shrink-0" strokeWidth={2.5} />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold truncate">{h.title}</p>
                    <p className="text-xs text-foreground/50 font-medium">{h.course} · {h.date}</p>
                  </div>
                </div>
                <span className="font-mono font-black text-lg shrink-0">
                  {h.score}
                  <span className="text-xs text-foreground/40 font-bold">/{h.total}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
