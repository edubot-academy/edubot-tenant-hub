import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { cl, useAttemptResult, type EnglishLevel, type EnglishSkill } from "@/lib/assessment-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/assessment/attempt/$attemptId/result")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.result.title")}` }] }),
  component: AssessmentResultPage,
});

// ─── CEFR config ──────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<EnglishLevel, { ring: string; badge: string; text: string }> = {
  A0: { ring: "ring-muted", badge: "bg-muted text-foreground/60", text: "text-foreground/60" },
  A1: { ring: "ring-blue-200 dark:ring-blue-800", badge: "bg-blue-500 text-white", text: "text-blue-600 dark:text-blue-400" },
  A2: { ring: "ring-teal-200 dark:ring-teal-800", badge: "bg-teal-500 text-white", text: "text-teal-600 dark:text-teal-400" },
  B1: { ring: "ring-green-200 dark:ring-green-800", badge: "bg-green-500 text-white", text: "text-green-600 dark:text-green-400" },
  B2: { ring: "ring-primary/20", badge: "bg-primary text-primary-foreground", text: "text-primary" },
};

const SKILL_COLORS: Record<EnglishSkill, string> = {
  grammar: "bg-blue-500",
  vocabulary: "bg-violet-500",
  reading: "bg-teal-500",
  communication: "bg-amber-500",
};

const SKILLS: EnglishSkill[] = ["grammar", "vocabulary", "reading", "communication"];

// ─── Score circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const value = Math.round(score);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center size-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute font-black text-2xl">{value}%</span>
    </div>
  );
}

// ─── Skill bar ────────────────────────────────────────────────────────────────

function SkillBar({
  skill,
  score,
  label,
  isWeak,
  t,
}: {
  skill: EnglishSkill;
  score: number;
  label: string;
  isWeak: boolean;
  t: (key: string) => string;
}) {
  const value = Math.round(score);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-black">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black font-mono">{value}%</span>
          {isWeak ? (
            <AlertTriangle className="size-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="size-4 text-green-500" />
          )}
        </div>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${SKILL_COLORS[skill]} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-foreground/45 font-medium">
        {isWeak ? t("assessment.result.needsWorkLabel") : t("assessment.result.masteredLabel")}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AssessmentResultPage() {
  const { attemptId } = Route.useParams();
  const { t, i18n: activeI18n } = useTranslation();
  const navigate = useNavigate();
  const lang = activeI18n.resolvedLanguage ?? activeI18n.language ?? "ky";
  const { data: result, isLoading, isError } = useAttemptResult(attemptId);

  const level = (result?.overallLevel ?? "A0") as EnglishLevel;
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.A0;
  const skillScores = result?.skillScores ?? {};
  const weakSkills = result?.weakSkills ?? [];
  const rec = result?.recommendation;

  const langKey = lang.charAt(0).toUpperCase() + lang.slice(1);
  const recTitle =
    rec?.[`learningPathTitle${langKey}` as keyof typeof rec] ??
    rec?.learningPathTitleEn ??
    "";
  const recMessage =
    rec?.[`message${langKey}` as keyof typeof rec] ??
    rec?.messageEn ??
    "";

  return (
    <DashboardShell>
      <TopBar title={t("assessment.result.title")} showStreak={false} />

      {isLoading ? (
        <div className="space-y-6 animate-pulse max-w-2xl">
          <div className="flex gap-6 items-center">
            <div className="size-28 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/2 rounded-full bg-muted" />
              <div className="h-4 w-3/4 rounded-full bg-muted" />
            </div>
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-1/4 rounded-full bg-muted" />
              <div className="h-2.5 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-8 text-center max-w-md">
          <p className="font-black text-destructive mb-4">{t("assessment.result.loadError")}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-border font-bold text-sm cursor-pointer hover:bg-muted"
          >
            <RotateCcw className="size-4" /> {t("assessment.result.retryBtn")}
          </button>
        </div>
      ) : result ? (
        <div className="space-y-6 max-w-2xl">
          {/* Level + Score */}
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center shrink-0">
              <div className={`size-28 rounded-full ring-8 ${cfg.ring} ${cfg.badge} flex flex-col items-center justify-center chunky-shadow`}>
                <span className="font-black text-3xl">{level}</span>
              </div>
              <p className={`mt-3 font-black text-lg ${cfg.text}`}>
                {t(`assessment.result.levels.${level}`)}
              </p>
              <p className="text-xs text-foreground/45 font-medium mt-0.5">
                {t("assessment.result.yourLevel")}
              </p>
            </div>

            <div className="w-px h-20 bg-border hidden sm:block" />

            <div className="text-center shrink-0">
              <ScoreCircle score={result.score} />
              <p className="text-xs text-foreground/45 font-medium mt-2">
                {t("assessment.result.score")}
              </p>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-foreground/70 leading-relaxed">
                {t(`assessment.result.levelDescriptions.${level}`)}
              </p>
            </div>
          </div>

          {/* Skill breakdown */}
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow space-y-5">
            <h2 className="font-black text-base">{t("assessment.result.skillBreakdown")}</h2>
            {SKILLS.map((skill) => (
              <SkillBar
                key={skill}
                skill={skill}
                score={skillScores[skill] ?? 0}
                label={t(`assessment.result.skills.${skill}`)}
                isWeak={weakSkills.includes(skill)}
                t={t}
              />
            ))}
          </div>

          {/* Weak skills */}
          {weakSkills.length > 0 && (
            <div className="rounded-3xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
              <h2 className="font-black text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="size-4" />
                {t("assessment.result.weakSkills")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {weakSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                  >
                    {t(`assessment.result.skills.${skill}`)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {rec && (
            <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 chunky-shadow">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                {t("assessment.result.recommendation")}
              </p>
              {recTitle && (
                <h2 className="font-black text-lg mb-2">{String(recTitle)}</h2>
              )}
              {recMessage && (
                <p className="text-sm text-foreground/70 leading-relaxed mb-5">
                  {String(recMessage)}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (rec.startLessonId) {
                    navigate({ to: "/course-player", search: { lessonId: rec.startLessonId } });
                  } else {
                    navigate({ to: "/student/courses" });
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow hover:opacity-90 transition-opacity cursor-pointer"
              >
                {t("assessment.result.startLearning")}
                <span aria-hidden>→</span>
              </button>
            </div>
          )}

          {/* Retake */}
          <div className="text-center pt-2">
            <Link
              to="/student/assessment/start"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-primary transition-colors"
            >
              <RotateCcw className="size-3.5" />
              {t("assessment.result.retakeTest")}
            </Link>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
