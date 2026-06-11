import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Bot, Check, Loader2, Pencil, Sparkles, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useInstructorGradingQueue,
  useGenerateFeedbackDraft,
  useReviewSubmission,
  type GradingQueueItem,
  type FeedbackDraftOutput,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/ai-grading")({
  head: () => ({
    meta: [
      {
        title: i18n.t("aiGradingPage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — AI Grading Assistant",
        }),
      },
    ],
  }),
  component: AiGradingPage,
});

function AiGradingPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") return <PrototypeAiGradingPage />;
  return <BackendAiGradingPage />;
}

function BackendAiGradingPage() {
  const { t } = useTranslation();
  const queueQuery = useInstructorGradingQueue({ status: "submitted", limit: 25 });
  const gradeMutation = useGenerateFeedbackDraft();
  const reviewMutation = useReviewSubmission();
  const [aiOutputs, setAiOutputs] = useState<Record<number, FeedbackDraftOutput>>({});
  const [grading, setGrading] = useState<Record<number, boolean>>({});
  const [reviewing, setReviewing] = useState<Record<number, boolean>>({});
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [overrideMode, setOverrideMode] = useState<Record<number, boolean>>({});
  const [overrideScores, setOverrideScores] = useState<Record<number, string>>({});
  const [gradingAll, setGradingAll] = useState(false);

  const items = queueQuery.data?.items ?? [];
  const visibleItems = items.filter((item) => !reviewedIds.has(item.submissionId));
  const gradedCount = Object.keys(aiOutputs).length;
  const approvedCount = reviewedIds.size;

  const grade = async (item: GradingQueueItem) => {
    setGrading((state) => ({ ...state, [item.submissionId]: true }));
    try {
      const result = await gradeMutation.mutateAsync({
        submissionId: item.submissionId,
        submissionType: item.kind === "homework" ? "homework" : "session_activity",
      });
      setAiOutputs((state) => ({ ...state, [item.submissionId]: result.output }));
    } catch {
      toast.error(t("aiGradingPage.toast.gradeFailed", { defaultValue: "AI grading failed. Check that AI is enabled for this course." }));
    } finally {
      setGrading((state) => ({ ...state, [item.submissionId]: false }));
    }
  };

  const gradeAll = async () => {
    const ungraded = items.filter((item) => !aiOutputs[item.submissionId]);
    if (!ungraded.length) return;
    setGradingAll(true);
    for (const item of ungraded) await grade(item);
    setGradingAll(false);
  };

  const approve = async (item: GradingQueueItem) => {
    const output = aiOutputs[item.submissionId];
    if (!output) return;
    setReviewing((state) => ({ ...state, [item.submissionId]: true }));
    try {
      await reviewMutation.mutateAsync({
        kind: item.kind,
        sessionId: item.sessionId,
        taskId: item.taskId,
        submissionId: item.submissionId,
        status: "approved",
        score: output.suggestedScore ?? undefined,
        reviewComment: output.feedback,
      });
      setReviewedIds((state) => new Set([...state, item.submissionId]));
      toast.success(t("aiGradingPage.toast.approved", { defaultValue: "Grade approved and saved." }));
    } catch {
      toast.error(t("aiGradingPage.toast.saveFailed", { defaultValue: "Failed to save grade." }));
    } finally {
      setReviewing((state) => ({ ...state, [item.submissionId]: false }));
    }
  };

  const submitOverride = async (item: GradingQueueItem) => {
    const rawScore = overrideScores[item.submissionId];
    const score = rawScore !== undefined ? Number(rawScore) : undefined;
    if (score !== undefined && (Number.isNaN(score) || score < 0 || score > 100)) {
      toast.error(t("aiGradingPage.toast.invalidScore", { defaultValue: "Score must be 0–100." }));
      return;
    }
    const output = aiOutputs[item.submissionId];
    setReviewing((state) => ({ ...state, [item.submissionId]: true }));
    try {
      await reviewMutation.mutateAsync({ kind: item.kind, sessionId: item.sessionId, taskId: item.taskId, submissionId: item.submissionId, status: "approved", score, reviewComment: output?.feedback });
      setReviewedIds((state) => new Set([...state, item.submissionId]));
      setOverrideMode((state) => ({ ...state, [item.submissionId]: false }));
      toast.success(t("aiGradingPage.toast.overrideSaved", { defaultValue: "Override saved." }));
    } catch {
      toast.error(t("aiGradingPage.toast.saveFailed", { defaultValue: "Failed to save grade." }));
    } finally {
      setReviewing((state) => ({ ...state, [item.submissionId]: false }));
    }
  };

  return (
    <DashboardShell>
      <TopBar title={t("aiGradingPage.topbar.title", { defaultValue: "AI Grading Assistant" })} subtitle={t("aiGradingPage.topbar.subtitle", { defaultValue: "Auto-score short answers, then approve or override." })} showStreak={false} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={t("aiGradingPage.stats.pending", { defaultValue: "Pending" })} value={String(queueQuery.data?.total ?? "—")} />
        <Stat label={t("aiGradingPage.stats.aiGraded", { defaultValue: "AI-graded" })} value={gradedCount > 0 ? `${gradedCount}/${items.length}` : "—"} />
        <Stat label={t("aiGradingPage.stats.approved", { defaultValue: "Approved" })} value={approvedCount > 0 ? String(approvedCount) : "—"} />
        <Stat label={t("aiGradingPage.stats.avgScore", { defaultValue: "Avg score" })} value={avgScore(aiOutputs)} />
      </div>

      {queueQuery.isLoading ? (
        <div className="space-y-3" aria-label={t("aiGradingPage.state.loading", { defaultValue: "Loading grading queue…" })}>
          {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-3xl bg-muted animate-pulse" />)}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="bg-card border-2 border-border rounded-3xl p-10 text-center chunky-shadow">
          <CheckCircle2 className="size-10 mx-auto text-primary/40 mb-3" strokeWidth={1.5} />
          <p className="font-black text-lg">{t("aiGradingPage.empty.title", { defaultValue: "All caught up" })}</p>
          <p className="text-sm font-medium text-foreground/55 mt-1">{t("aiGradingPage.empty.body", { defaultValue: "No pending submissions in the grading queue." })}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground/60">{t("aiGradingPage.labels.pendingReview", { count: visibleItems.length, defaultValue: "{{count}} submissions pending review." })}</p>
            <button onClick={gradeAll} disabled={gradingAll || visibleItems.every((item) => !!aiOutputs[item.submissionId])} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black text-sm disabled:opacity-50">
              {gradingAll ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={2.5} />}
              {t("aiGradingPage.actions.gradeAll", { defaultValue: "Grade all with AI" })}
            </button>
          </div>

          <div className="space-y-3">
            {visibleItems.map((item) => {
              const output = aiOutputs[item.submissionId];
              const isGrading = grading[item.submissionId];
              const isReviewing = reviewing[item.submissionId];
              const isOverride = overrideMode[item.submissionId];
              return (
                <article key={item.submissionId} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-black truncate">{item.studentName ?? t("aiGradingPage.labels.unknownStudent", { defaultValue: "Unknown student" })}</p>
                      <p className="text-sm font-bold text-foreground/65 mt-0.5 truncate">{item.taskTitle}</p>
                      <p className="text-[11px] font-medium text-foreground/45 mt-0.5 truncate">{item.courseTitle} · {item.sessionTitle}</p>
                    </div>
                    {output?.suggestedScore != null && !isOverride && <ScoreBadge score={output.suggestedScore} />}
                  </div>

                  {output ? <AiFeedbackPanel output={output} /> : (
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/50 mb-1">
                      {item.hasText && <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">{t("aiGradingPage.labels.textAnswer", { defaultValue: "Text answer" })}</span>}
                      {item.hasAttachment && <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">{t("aiGradingPage.labels.attachment", { defaultValue: "Attachment" })}</span>}
                    </div>
                  )}

                  {isOverride && (
                    <div className="mt-3 flex items-center gap-2">
                      <input type="number" min={0} max={100} value={overrideScores[item.submissionId] ?? output?.suggestedScore ?? ""} onChange={(event) => setOverrideScores((state) => ({ ...state, [item.submissionId]: event.target.value }))} placeholder={t("aiGradingPage.fields.score", { defaultValue: "Score (0–100)" })} className="w-32 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary" />
                      <button onClick={() => submitOverride(item)} disabled={isReviewing} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                        {isReviewing ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        {t("aiGradingPage.actions.saveOverride", { defaultValue: "Save override" })}
                      </button>
                      <button onClick={() => setOverrideMode((state) => ({ ...state, [item.submissionId]: false }))} className="px-3 py-2 rounded-xl bg-muted font-bold text-xs text-foreground/60">{t("aiGradingPage.actions.cancel", { defaultValue: "Cancel" })}</button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button onClick={() => grade(item)} disabled={isGrading} className="px-3 py-2 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                      {isGrading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {output ? t("aiGradingPage.actions.regrade", { defaultValue: "Regrade" }) : t("aiGradingPage.actions.gradeWithAi", { defaultValue: "Grade with AI" })}
                    </button>
                    {output && !isOverride && (
                      <div className="flex gap-2">
                        <button onClick={() => { setOverrideMode((state) => ({ ...state, [item.submissionId]: true })); setOverrideScores((state) => ({ ...state, [item.submissionId]: String(output.suggestedScore ?? "") })); }} className="px-3 py-2 rounded-xl border-2 border-border bg-card hover:bg-muted font-bold text-xs flex items-center gap-1.5">
                          <Pencil className="size-3.5" /> {t("aiGradingPage.actions.overrideScore", { defaultValue: "Override score" })}
                        </button>
                        <button onClick={() => approve(item)} disabled={isReviewing} className="px-3 py-2 rounded-xl border-2 border-foreground bg-primary text-primary-foreground chunky-shadow font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                          {isReviewing ? <Loader2 className="size-3.5 animate-spin" /> : <ThumbsUp className="size-3.5" />}
                          {t("aiGradingPage.actions.approve", { defaultValue: "Approve" })}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function AiFeedbackPanel({ output }: { output: FeedbackDraftOutput }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 space-y-2">
      <div className="p-3 rounded-2xl bg-primary/5 border-2 border-primary/20 flex gap-3">
        <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 mt-0.5"><Bot className="size-3.5" strokeWidth={2.5} /></div>
        <p className="text-sm font-medium text-foreground/85 leading-relaxed">{output.feedback}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {output.whatWentWell.length > 0 && <FeedbackList ariaLabel={t("aiGradingPage.labels.whatWentWell", { defaultValue: "What went well" })} icon={<CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />} items={output.whatWentWell} />}
        {output.needsImprovement.length > 0 && <FeedbackList ariaLabel={t("aiGradingPage.labels.needsImprovement", { defaultValue: "Needs improvement" })} icon={<AlertCircle className="size-3.5 text-accent-foreground shrink-0 mt-0.5" />} items={output.needsImprovement} />}
      </div>
      {output.nextStep && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted text-xs font-medium text-foreground/70"><ChevronRight className="size-3.5 shrink-0 mt-0.5 text-foreground/40" /><span>{output.nextStep}</span></div>}
    </div>
  );
}

function FeedbackList({ icon, items, ariaLabel }: { icon: ReactNode; items: string[]; ariaLabel: string }) {
  return <ul className="space-y-1 p-3 rounded-xl bg-muted/50 border border-border" aria-label={ariaLabel}>{items.map((item, index) => <li key={index} className="flex items-start gap-1.5 text-xs font-medium text-foreground/75">{icon}{item}</li>)}</ul>;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-primary/15 text-primary border-primary/40" : score >= 50 ? "bg-accent/20 text-accent-foreground border-accent/40" : "bg-destructive/15 text-destructive border-destructive/40";
  return <div className={`px-3 py-1.5 rounded-xl font-black text-sm border-2 shrink-0 ${cls}`}>{score}/100</div>;
}

function avgScore(outputs: Record<number, FeedbackDraftOutput>) {
  const scores = Object.values(outputs).map((output) => output.suggestedScore).filter((score): score is number => score !== null);
  if (!scores.length) return "—";
  return `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow"><p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>;
}

type PrototypeItem = { id: string; student: string; question: string; answer: string; expected: string; aiScore?: number; aiFeedback?: string; approved?: boolean };

const SEED: PrototypeItem[] = [
  { id: "1", student: "Mia Chen", question: "Define working memory.", expected: "A limited-capacity system that temporarily holds & manipulates info.", answer: "Working memory is a short-term store that lets us hold and use information for a few seconds while thinking." },
  { id: "2", student: "Leo Park", question: "Name the components of Baddeley's model.", expected: "Phonological loop, visuospatial sketchpad, central executive, episodic buffer.", answer: "The loop and sketchpad with a central executive." },
  { id: "3", student: "Ava Diaz", question: "Why is chunking useful?", expected: "Chunking groups items so capacity holds more information.", answer: "Because it makes things easier to remember by grouping them." },
  { id: "4", student: "Sam Cole", question: "What is the typical capacity of WM?", expected: "About 4 chunks (Cowan).", answer: "7 plus or minus 2." },
];

function PrototypeAiGradingPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PrototypeItem[]>(SEED);
  const [running, setRunning] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const grade = (id: string) => { setRunning(id); setTimeout(() => { setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...mockGrade(item, t) } : item))); setRunning(null); }, 700); };
  const gradeAll = () => { setBulk(true); setItems((prev) => prev.map((item) => ({ ...item, ...mockGrade(item, t) }))); setTimeout(() => setBulk(false), 800); };
  const setApproved = (id: string, ok: boolean) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, approved: ok } : item)));
  const graded = items.filter((item) => item.aiScore !== undefined).length;
  const approved = items.filter((item) => item.approved === true).length;

  return (
    <DashboardShell>
      <TopBar title={t("aiGradingPage.topbar.title", { defaultValue: "AI Grading Assistant" })} subtitle={t("aiGradingPage.topbar.subtitle", { defaultValue: "Auto-score short answers, then approve or override." })} showStreak={false} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={t("aiGradingPage.stats.submissions", { defaultValue: "Submissions" })} value={String(items.length)} />
        <Stat label={t("aiGradingPage.stats.autoGraded", { defaultValue: "Auto-graded" })} value={`${graded}/${items.length}`} />
        <Stat label={t("aiGradingPage.stats.approved", { defaultValue: "Approved" })} value={String(approved)} />
        <Stat label={t("aiGradingPage.stats.avgConfidence", { defaultValue: "Avg confidence" })} value={graded ? "87%" : "—"} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-foreground/60">{t("aiGradingPage.prototype.reviewNotice", { defaultValue: "Review AI scores before publishing grades." })}</p>
        <button onClick={gradeAll} disabled={bulk} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black text-sm disabled:opacity-50">
          {bulk ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={2.5} />}{t("aiGradingPage.actions.gradeAll", { defaultValue: "Grade all with AI" })}
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-start justify-between gap-3 mb-3"><div><p className="font-black text-base">{item.student}</p><p className="text-sm font-bold text-foreground/70 mt-0.5">{item.question}</p></div>{item.aiScore !== undefined && <ScoreBadge score={item.aiScore} />}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="p-3 rounded-2xl border-2 border-border bg-background"><p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">{t("aiGradingPage.labels.studentAnswer", { defaultValue: "Student answer" })}</p><p className="text-sm font-medium">{item.answer}</p></div><div className="p-3 rounded-2xl border-2 border-border bg-muted/50"><p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">{t("aiGradingPage.labels.expected", { defaultValue: "Expected" })}</p><p className="text-sm font-medium">{item.expected}</p></div></div>
            {item.aiFeedback && <div className="mt-3 p-3 rounded-2xl bg-primary/5 border-2 border-primary/20 flex gap-3"><div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0"><Bot className="size-4" strokeWidth={2.5} /></div><p className="text-sm font-medium text-foreground/85">{item.aiFeedback}</p></div>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><button onClick={() => grade(item.id)} disabled={running === item.id} className="px-3 py-2 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">{running === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{item.aiScore !== undefined ? t("aiGradingPage.actions.regrade", { defaultValue: "Regrade" }) : t("aiGradingPage.actions.gradeWithAi", { defaultValue: "Grade with AI" })}</button>{item.aiScore !== undefined && <div className="flex gap-2"><button onClick={() => setApproved(item.id, false)} className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${item.approved === false ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card border-border hover:bg-muted"}`}><ThumbsDown className="size-3.5" /> {t("aiGradingPage.actions.override", { defaultValue: "Override" })}</button><button onClick={() => setApproved(item.id, true)} className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${item.approved ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:bg-muted"}`}><ThumbsUp className="size-3.5" /> {t("aiGradingPage.actions.approve", { defaultValue: "Approve" })}</button></div>}</div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function mockGrade(item: PrototypeItem, t: ReturnType<typeof useTranslation>["t"]): Partial<PrototypeItem> {
  const answer = new Set(item.answer.toLowerCase().split(/\W+/).filter(Boolean));
  const expected = new Set(item.expected.toLowerCase().split(/\W+/).filter(Boolean));
  const overlap = [...answer].filter((word) => expected.has(word)).length;
  const score = Math.min(100, Math.round((overlap / expected.size) * 110));
  const feedback = score >= 80
    ? t("aiGradingPage.prototype.feedbackStrong", { defaultValue: "Strong answer that captures the core idea. Minor wording differences." })
    : score >= 50
      ? t("aiGradingPage.prototype.feedbackPartial", { defaultValue: "Partially correct. Missing one or two key components — see expected answer." })
      : t("aiGradingPage.prototype.feedbackWeak", { defaultValue: "Off-target. Recommend revisiting the lesson and resubmitting." });
  return { aiScore: score, aiFeedback: feedback };
}
