import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";

import { QuizArenaCard } from "@/components/student/QuizArenaCard";
import { useAppContext } from "@/lib/app-context";
import { useStudentPortalTasks } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/quizzes")({
  head: () => ({ meta: [{ title: "QuestLMS — Quizzes" }] }),
  component: StudentQuizzesPage,
});

const prototypeHistory = [
  { id: "q1", title: "Attention models", course: "Cognitive Psychology", score: 92, total: 100, status: "passed" as const, date: "Yesterday" },
  { id: "q2", title: "Nucleophilic substitution", course: "Organic Chemistry II", score: 71, total: 100, status: "passed" as const, date: "2d ago" },
  { id: "q3", title: "Working memory pop quiz", course: "Cognitive Psychology", score: 48, total: 100, status: "failed" as const, date: "5d ago" },
];

function StudentQuizzesPage() {
  const { context } = useAppContext();
  const tasksQuery = useStudentPortalTasks();

  if (context.mode !== "backend") {
    return <PrototypeQuizzesPage />;
  }

  const quizTasks = (tasksQuery.data ?? []).filter((task) => task.kind === "quiz");
  const upcoming = quizTasks.filter((task) => !task.attempt && ["open", "overdue"].includes(task.status));
  const history = quizTasks
    .filter((task) => task.attempt)
    .sort((left, right) => new Date(right.attempt?.createdAt ?? 0).getTime() - new Date(left.attempt?.createdAt ?? 0).getTime());

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
          {tasksQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((index) => <div key={index} className="h-14 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No upcoming quizzes.</div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((quiz) => (
                <li key={quiz.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{quiz.title}</p>
                    <p className="text-xs text-foreground/50 font-medium">{quiz.courseTitle ?? "Course"}</p>
                  </div>
                  <span className="text-xs font-bold text-primary font-mono shrink-0">{quiz.dueAt ?? "Scheduled"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" strokeWidth={2.5} /> Past attempts
        </h3>
        {tasksQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((index) => <div key={index} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">No quiz attempts yet.</div>
        ) : (
          <div className="space-y-2">
            {history.map((quiz) => {
              const score = quiz.attempt?.score ?? 0;
              const passed = Boolean(quiz.attempt?.passed);
              return (
                <div key={quiz.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {passed ? (
                      <CheckCircle2 className="size-5 text-success shrink-0" strokeWidth={2.5} />
                    ) : (
                      <XCircle className="size-5 text-destructive shrink-0" strokeWidth={2.5} />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold truncate">{quiz.title}</p>
                      <p className="text-xs text-foreground/50 font-medium">
                        {quiz.courseTitle ?? "Course"} · {quiz.attempt?.createdAt ?? "Recent"}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-lg shrink-0">
                    {score}
                    <span className="text-xs text-foreground/40 font-bold">/100</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function PrototypeQuizzesPage() {
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
          <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">Prototype mode uses local quiz content.</div>
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" strokeWidth={2.5} /> Past attempts
        </h3>
        <div className="space-y-2">
          {prototypeHistory.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 className="size-5 text-success shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="font-bold truncate">{h.title}</p>
                  <p className="text-xs text-foreground/50 font-medium">{h.course} · {h.date}</p>
                </div>
              </div>
              <span className="font-mono font-black text-lg shrink-0">{h.score}<span className="text-xs text-foreground/40 font-bold">/{h.total}</span></span>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
