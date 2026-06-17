import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { QuizArenaCard } from "@/components/student/QuizArenaCard";
import { useAppContext } from "@/lib/app-context";
import { useStudentPortalTasks } from "@/lib/student-portal-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/quizzes")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.quizzes.metaTitle", { appName: i18n.t("app.name") }) }] }),
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
  const { t } = useTranslation();

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
      <TopBar title={t("studentPages.quizzes.topbarTitle")} subtitle={t("studentPages.quizzes.topbarSubtitle")} showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <QuizArenaCard />
        </div>
        <section className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Clock className="size-5 text-primary" strokeWidth={2.5} /> {t("studentPages.quizzes.upcoming")}
          </h3>
          {tasksQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((index) => <div key={index} className="h-14 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-brand-accent-border bg-brand-accent-soft/30 p-5 flex items-center gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-brand-accent-soft grid place-items-center">
                <Clock className="size-5 text-accent" strokeWidth={2} />
              </div>
              <div>
                <p className="font-black text-sm">{t("studentPages.quizzes.noUpcomingTitle", { defaultValue: "All clear!" })}</p>
                <p className="text-xs font-medium text-foreground/55 mt-0.5">{t("studentPages.quizzes.noUpcoming")}</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((quiz) => (
                <li key={quiz.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{quiz.title}</p>
                    <p className="text-xs text-foreground/50 font-medium">{quiz.courseTitle ?? t("studentPages.common.course")}</p>
                  </div>
                  <span className="text-xs font-bold text-primary font-mono shrink-0">{quiz.dueAt ?? t("studentPages.status.scheduled")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" strokeWidth={2.5} /> {t("studentPages.quizzes.pastAttempts")}
        </h3>
        {tasksQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((index) => <div key={index} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-brand-primary-border bg-brand-primary-soft/30 p-7 flex flex-col items-center text-center gap-3">
            <div className="size-12 rounded-2xl bg-brand-primary-soft grid place-items-center">
              <Trophy className="size-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-black text-sm">{t("studentPages.quizzes.noAttempts")}</p>
            <p className="text-xs font-medium text-foreground/50">
              {t("studentPages.quizzes.noAttemptsHint", { defaultValue: "Complete your first quiz to see results here." })}
            </p>
          </div>
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
                        {quiz.courseTitle ?? t("studentPages.common.course")} · {quiz.attempt?.createdAt ?? t("studentPages.common.recent")}
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
  const { t } = useTranslation();
  return (
    <DashboardShell>
      <TopBar title={t("studentPages.quizzes.topbarTitle")} subtitle={t("studentPages.quizzes.topbarSubtitle")} showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <QuizArenaCard />
        </div>
        <section className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl flex items-center gap-2 mb-4">
            <Clock className="size-5 text-primary" strokeWidth={2.5} /> {t("studentPages.quizzes.upcoming")}
          </h3>
          <div className="rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/60">{t("studentPages.quizzes.prototypeNotice")}</div>
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" strokeWidth={2.5} /> {t("studentPages.quizzes.pastAttempts")}
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
