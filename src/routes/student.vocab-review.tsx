import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Check, X, RotateCcw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useVocabDueCards, useRecordVocabReview, type VocabDueCard } from "@/lib/student-portal-api";

export const Route = createFileRoute("/student/vocab-review")({
  head: () => ({ meta: [{ title: "QuestLMS — Vocabulary Review" }] }),
  component: VocabReviewPage,
});

function VocabReviewPage() {
  const { t } = useTranslation();
  const dueQuery = useVocabDueCards();
  const cards = dueQuery.data ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const recordReview = useRecordVocabReview();

  const current = cards[index] ?? null;

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!current) return;
      recordReview.mutate({ reviewId: current.reviewId, correct });
      setFlipped(false);
      if (index + 1 >= cards.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    },
    [current, index, cards.length, recordReview],
  );

  function restart() {
    setIndex(0);
    setFlipped(false);
    setDone(false);
    dueQuery.refetch();
  }

  return (
    <DashboardShell>
      <TopBar
        title={t("vocabReview.title", "Vocabulary Review")}
        subtitle={t("vocabReview.subtitle", "Spaced repetition flashcards")}
        showStreak={false}
      />

      {dueQuery.isLoading ? (
        <div className="h-64 rounded-3xl border-2 border-border bg-card animate-pulse" />
      ) : cards.length === 0 || done ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4">
          <Brain className="size-12 mx-auto text-primary/40" />
          <p className="font-black text-lg">
            {done
              ? t("vocabReview.sessionDone", "Session complete!")
              : t("vocabReview.noDue", "No cards due for review right now.")}
          </p>
          <p className="text-sm text-foreground/50">
            {t("vocabReview.comeBack", "Great work — come back later for the next round.")}
          </p>
          {done && (
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 mt-2 bg-primary text-primary-foreground rounded-2xl px-5 py-2.5 font-bold text-sm"
            >
              <RotateCcw className="size-4" />
              {t("vocabReview.reviewMore", "Check for more cards")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 max-w-lg mx-auto">
          <div className="text-xs text-foreground/50 font-bold text-center uppercase tracking-widest">
            {t("vocabReview.progress", "Card {{current}} of {{total}}", {
              current: index + 1,
              total: cards.length,
            })}
          </div>

          <FlashCard card={current!} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

          {flipped && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 text-destructive font-bold py-3 text-sm hover:bg-destructive/5 transition-colors"
              >
                <X className="size-4" />
                {t("vocabReview.missed", "Missed")}
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-green-500/40 text-green-600 font-bold py-3 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Check className="size-4" />
                {t("vocabReview.gotIt", "Got it!")}
              </button>
            </div>
          )}

          {!flipped && (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-3 text-sm"
            >
              {t("vocabReview.flip", "Reveal definition")}
            </button>
          )}

          <div className="flex justify-center">
            <span className="text-[11px] text-foreground/40 font-medium">
              {t("vocabReview.box", "Leitner box {{box}}", { box: current?.box ?? 1 })}
            </span>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function FlashCard({ card, flipped, onFlip }: { card: VocabDueCard; flipped: boolean; onFlip: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onFlip}
      className="w-full min-h-[200px] rounded-3xl border-2 border-border bg-card chunky-shadow p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
    >
      {!flipped ? (
        <>
          <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest mb-2">
            {t("vocabReview.word", "Word")}
          </p>
          <p className="text-2xl font-black">{card.word ?? "—"}</p>
          <p className="text-xs text-foreground/40 mt-3">{t("vocabReview.tapHint", "Tap to reveal")}</p>
        </>
      ) : (
        <>
          <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest mb-2">
            {t("vocabReview.definition", "Definition")}
          </p>
          <p className="text-lg font-bold">{card.definition ?? "—"}</p>
        </>
      )}
    </button>
  );
}
