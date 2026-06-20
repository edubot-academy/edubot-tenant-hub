import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { BookOpen, Clock, GraduationCap, Map, RotateCcw, Play } from "lucide-react";
import i18n from "@/lib/i18n";
import { useMyCurrentAttempt, abandonAttempt, useMyLatestResult, assessmentKeys } from "@/lib/assessment-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/student/assessment/")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.intro.title")}` }] }),
  component: AssessmentIntroPage,
});

// ─── CEFR levels ─────────────────────────────────────────────────────────────

const LEVELS = [
  { label: "A0", cls: "bg-muted text-foreground/60 border-border" },
  { label: "A1", cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  { label: "A2", cls: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  { label: "B1", cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
  { label: "B2", cls: "bg-primary/10 text-primary border-primary/30" },
];

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-border bg-card">
      <span className="shrink-0 size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-black text-sm">{title}</p>
        <p className="text-xs text-foreground/55 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AssessmentIntroPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: current, isLoading: loadingCurrent } = useMyCurrentAttempt();
  const { data: latest } = useMyLatestResult();
  const [abandoning, setAbandoning] = useState(false);
  const activeCurrent =
    current?.expiresAt && Number.isFinite(new Date(current.expiresAt).getTime()) && new Date(current.expiresAt).getTime() <= Date.now()
      ? null
      : current;

  const handleStartOver = async () => {
    if (!activeCurrent) return;
    setAbandoning(true);
    try {
      await abandonAttempt(activeCurrent.id);
      qc.setQueryData(assessmentKeys.myCurrent(), null);
      qc.invalidateQueries({ queryKey: ["assessment"] });
      navigate({ to: "/student/assessment/start" });
    } finally {
      setAbandoning(false);
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("assessment.intro.title")}
        subtitle={t("assessment.intro.subtitle")}
        showStreak={false}
      />

      {/* CEFR level strip */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {LEVELS.map((lvl, i) => (
          <div key={lvl.label} className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center size-9 rounded-xl border-2 font-black text-sm ${lvl.cls}`}>
              {lvl.label}
            </span>
            {i < LEVELS.length - 1 && (
              <span className="text-foreground/20 font-bold text-xs">›</span>
            )}
          </div>
        ))}
        <span className="ml-1 text-xs font-medium text-foreground/40">{t("assessment.intro.features.levels")}</span>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <FeatureCard icon={BookOpen} title={t("assessment.intro.features.questions")} desc={t("assessment.intro.features.questionsDesc")} />
        <FeatureCard icon={Clock} title={t("assessment.intro.features.time")} desc={t("assessment.intro.features.timeDesc")} />
        <FeatureCard icon={GraduationCap} title={t("assessment.intro.features.levels")} desc={t("assessment.intro.features.levelsDesc")} />
        <FeatureCard icon={Map} title={t("assessment.intro.features.path")} desc={t("assessment.intro.features.pathDesc")} />
      </div>

      {/* CTA — changes based on attempt state */}
      <div className="flex flex-col items-center gap-3">
        {loadingCurrent ? (
          <div className="h-12 w-48 rounded-2xl bg-muted animate-pulse" />
        ) : activeCurrent ? (
          <>
            <Link
              to="/student/assessment/attempt/$attemptId"
              params={{ attemptId: String(activeCurrent.id) }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-base chunky-shadow hover:opacity-90 transition-opacity"
            >
              <Play className="size-4" />
              {t("assessment.intro.resumeBtn", "Resume Test")}
            </Link>
            <button
              onClick={handleStartOver}
              disabled={abandoning}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground/80 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              {t("assessment.intro.startOverBtn", "Start over")}
            </button>
          </>
        ) : latest ? (
          <div className="flex flex-col items-center gap-3">
            <Link
              to="/student/assessment/attempt/$attemptId/result"
              params={{ attemptId: String(latest.id) }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary/10 text-primary border-2 border-primary/30 font-black text-base chunky-shadow hover:opacity-90 transition-opacity"
            >
              {t("assessment.intro.viewResultBtn", "View My Results")}
              <span aria-hidden>→</span>
            </Link>
            <Link
              to="/student/assessment/start"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground/80 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              {t("assessment.intro.retakeBtn", "Retake Test")}
            </Link>
          </div>
        ) : (
          <Link
            to="/student/assessment/start"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-base chunky-shadow hover:opacity-90 transition-opacity"
          >
            {t("assessment.intro.startBtn")}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </DashboardShell>
  );
}
