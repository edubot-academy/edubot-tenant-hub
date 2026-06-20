import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  assessmentKeys,
  cl,
  fetchMyCurrentAttempt,
  fetchNextQuestion,
  postAnswer,
  postComplete,
  useMyCurrentAttempt,
  type AssessmentQuestion,
  type AssessmentOption,
} from "@/lib/assessment-api";
import { ApiError } from "@/lib/api/client";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/assessment/attempt/$attemptId/")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.intro.badge")}` }] }),
  component: AssessmentTestPage,
});

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DEFAULT_TIME_LIMIT = 25 * 60;

function getRemainingTime(attempt: { startedAt: string; expiresAt?: string | null; timeLimitMinutes?: number | null }) {
  if (attempt.expiresAt) {
    const expiresAtMs = new Date(attempt.expiresAt).getTime();
    if (Number.isFinite(expiresAtMs)) {
      return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    }
  }

  const limitSeconds =
    Number.isFinite(attempt.timeLimitMinutes) && (attempt.timeLimitMinutes ?? 0) > 0
      ? attempt.timeLimitMinutes! * 60
      : DEFAULT_TIME_LIMIT;
  const startedAtMs = new Date(attempt.startedAt).getTime();
  if (!Number.isFinite(startedAtMs)) return limitSeconds;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
  return Math.max(0, limitSeconds - elapsedSeconds);
}

function isExpiredAttempt(attempt: { expiresAt?: string | null } | null | undefined) {
  if (!attempt?.expiresAt) return false;
  const expiresAtMs = new Date(attempt.expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round(((current - 1) / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemax={total}
      />
    </div>
  );
}

const OPTION_LABELS = ["A", "B", "C", "D"];

function OptionButton({
  option,
  lang,
  selected,
  disabled,
  onSelect,
}: {
  option: AssessmentOption;
  lang: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: number) => void;
}) {
  const label = OPTION_LABELS[option.order] ?? String.fromCharCode(65 + option.order);

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={[
        "w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/5 chunky-shadow"
          : "border-border bg-card hover:border-foreground/20",
        disabled && !selected ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span className={`shrink-0 size-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/60"}`}>
        {label}
      </span>
      <span className="pt-0.5 text-sm font-medium leading-relaxed">
        {cl(option.text, lang)}
      </span>
    </button>
  );
}

function ExpiredOverlay({ t, onViewResults }: { t: (key: string) => string; onViewResults: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border-2 border-border rounded-3xl p-8 max-w-sm w-full text-center chunky-shadow">
        <Clock className="size-12 mx-auto text-primary mb-4" />
        <h2 className="font-black text-xl mb-2">{t("assessment.test.expiredTitle")}</h2>
        <p className="text-sm text-foreground/60 mb-6">{t("assessment.test.expiredMessage")}</p>
        <button
          type="button"
          onClick={onViewResults}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-black cursor-pointer"
        >
          {t("assessment.test.viewResults")}
        </button>
      </div>
    </div>
  );
}

function AssessmentTestPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, i18n: activeI18n } = useTranslation();
  const lang = activeI18n.resolvedLanguage ?? activeI18n.language ?? "ky";
  const { data: currentAttempt, isLoading: isCurrentAttemptLoading } = useMyCurrentAttempt();

  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const questionStartedAt = useRef(Date.now());
  const finalizingRef = useRef(false);
  const timerStarted = useRef(false);

  const navigateToResults = useCallback(() => {
    qc.setQueryData(assessmentKeys.myCurrent(), null);
    qc.invalidateQueries({ queryKey: ["assessment"] });
    navigate({ to: "/student/assessment/attempt/$attemptId/result", params: { attemptId }, replace: true });
  }, [attemptId, navigate, qc]);

  const recoverExpiredAttempt = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: assessmentKeys.myCurrent() });
    const activeAttempt = await qc.fetchQuery({
      queryKey: assessmentKeys.myCurrent(),
      queryFn: fetchMyCurrentAttempt,
      staleTime: 0,
    });

    if (activeAttempt && !isExpiredAttempt(activeAttempt) && String(activeAttempt.id) !== attemptId) {
      navigate({
        to: "/student/assessment/attempt/$attemptId",
        params: { attemptId: String(activeAttempt.id) },
        replace: true,
      });
      return true;
    }

    qc.setQueryData(assessmentKeys.myCurrent(), null);
    qc.invalidateQueries({ queryKey: ["assessment"] });
    navigate({ to: "/student/assessment/start", replace: true });
    return true;
  }, [attemptId, navigate, qc]);

  useEffect(() => {
    if (isCurrentAttemptLoading) return;

    if (currentAttempt && !isExpiredAttempt(currentAttempt) && String(currentAttempt.id) !== attemptId) {
      navigate({
        to: "/student/assessment/attempt/$attemptId",
        params: { attemptId: String(currentAttempt.id) },
        replace: true,
      });
      return;
    }

    if (currentAttempt && !isExpiredAttempt(currentAttempt) && String(currentAttempt.id) === attemptId) {
      setTimeLeft(getRemainingTime(currentAttempt));
      return;
    }

    setTimeLeft(DEFAULT_TIME_LIMIT);
  }, [attemptId, currentAttempt, isCurrentAttemptLoading, navigate]);

  useEffect(() => {
    if (timeLeft === null || timerStarted.current) return;
    timerStarted.current = true;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !expired && !finalizingRef.current) {
      finalizingRef.current = true;
      setExpired(true);
      postComplete(attemptId).catch((err) => {
        console.error("[assessment] failed to complete attempt on timer expiry:", err);
        toast.error(t("assessment.test.submitError"));
      });
    }
  }, [timeLeft, expired, attemptId, t]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setSelectedOptionId(null);
    questionStartedAt.current = Date.now();
    try {
      const data = await fetchNextQuestion(attemptId);
      if (data.done || !data.question) {
        navigateToResults();
        return;
      }
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      setQuestionNumber((current) =>
        typeof data.questionIndex === "number" ? data.questionIndex + 1 : current,
      );
      setQuestion(data.question);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ASSESSMENT_ATTEMPT_EXPIRED") {
        await recoverExpiredAttempt();
        return;
      }
      if (err instanceof ApiError && err.code === "ASSESSMENT_ATTEMPT_ALREADY_COMPLETED") {
        navigateToResults();
        return;
      }
      toast.error(err instanceof Error ? err.message : t("assessment.test.submitError"));
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigateToResults, recoverExpiredAttempt, t]);

  useEffect(() => {
    if (isCurrentAttemptLoading) return;
    if (currentAttempt && !isExpiredAttempt(currentAttempt) && String(currentAttempt.id) !== attemptId) return;
    loadNext();
  }, [attemptId, currentAttempt, isCurrentAttemptLoading, loadNext]);

  const handleNext = async () => {
    if (!selectedOptionId || submitting || !question) return;
    setSubmitting(true);
    const timeSpentSeconds = Math.round((Date.now() - questionStartedAt.current) / 1000);
    try {
      const res = await postAnswer(attemptId, {
        questionId: question.id,
        selectedOptionId,
        timeSpentSeconds,
      });
      if (res.done || res.attemptStatus === "completed") {
        navigateToResults();
        return;
      }
      await loadNext();
    } catch (err) {
      if (err instanceof ApiError && err.code === "ASSESSMENT_ATTEMPT_EXPIRED") {
        await recoverExpiredAttempt();
        return;
      }
      if (err instanceof ApiError && err.code === "ASSESSMENT_ATTEMPT_ALREADY_COMPLETED") {
        navigateToResults();
        return;
      }
      toast.error(err instanceof Error ? err.message : t("assessment.test.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = questionNumber >= totalQuestions;
  const timerWarning = timeLeft !== null && timeLeft < 5 * 60;

  return (
    <DashboardShell>
      {expired && (
        <ExpiredOverlay
          t={t}
          onViewResults={() =>
            navigate({ to: "/student/assessment/attempt/$attemptId/result", params: { attemptId }, replace: true })
          }
        />
      )}

      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur-sm border-b border-border mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-black text-foreground/50 text-xs uppercase tracking-widest">
            {t("assessment.test.questionOf", { current: questionNumber, total: totalQuestions })}
          </span>
          <span className={`inline-flex items-center gap-1.5 font-black font-mono ${timerWarning ? "text-destructive" : "text-foreground/60"}`}>
            <Clock className="size-3.5" />
            {timeLeft === null ? "--:--" : formatTime(timeLeft)}
          </span>
        </div>
        <ProgressBar current={questionNumber} total={totalQuestions} />
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-1/4 rounded-full bg-muted" />
            <div className="h-7 w-full rounded-full bg-muted" />
            <div className="h-7 w-4/5 rounded-full bg-muted" />
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-muted" />)}
            </div>
          </div>
        ) : question ? (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="px-2.5 py-0.5 rounded-lg border border-border bg-muted text-xs font-black uppercase tracking-wide">
                {question.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg border border-border bg-muted text-xs font-bold capitalize text-foreground/60">
                {t(`assessment.result.skills.${question.skill}`)}
              </span>
            </div>

            <h2 className="font-black text-xl sm:text-2xl leading-snug mb-8">
              {cl(question.question, lang)}
            </h2>

            <div className="space-y-3">
              {[...question.options]
                .sort((a, b) => a.order - b.order)
                .map((option) => (
                  <OptionButton
                    key={option.id}
                    option={option}
                    lang={lang}
                    selected={selectedOptionId === option.id}
                    disabled={submitting}
                    onSelect={setSelectedOptionId}
                  />
                ))}
            </div>

            {!selectedOptionId && (
              <p className="mt-4 text-xs text-foreground/40 text-center font-medium">
                {t("assessment.test.selectOption")}
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedOptionId || submitting}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting
                  ? "…"
                  : isLast
                    ? t("assessment.test.finishBtn")
                    : t("assessment.test.nextBtn")}
                {!submitting && <span aria-hidden>→</span>}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
