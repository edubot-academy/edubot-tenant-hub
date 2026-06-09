import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Bot, Check, Loader2, Pencil, Sparkles, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import {
  useInstructorGradingQueue,
  useGenerateFeedbackDraft,
  useReviewSubmission,
  type GradingQueueItem,
  type FeedbackDraftOutput,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/ai-grading")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Grading Assistant" }] }),
  component: AiGradingPage,
});

function AiGradingPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") return <PrototypeAiGradingPage />;
  return <BackendAiGradingPage />;
}

// ─── Backend implementation ───────────────────────────────────────────────────

function BackendAiGradingPage() {
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

  const grade = async (item: GradingQueueItem) => {
    setGrading((s) => ({ ...s, [item.submissionId]: true }));
    try {
      const result = await gradeMutation.mutateAsync({
        submissionId: item.submissionId,
        submissionType: item.kind === "homework" ? "homework" : "session_activity",
      });
      setAiOutputs((s) => ({ ...s, [item.submissionId]: result.output }));
    } catch {
      toast.error("AI grading failed. Check that AI is enabled for this course.");
    } finally {
      setGrading((s) => ({ ...s, [item.submissionId]: false }));
    }
  };

  const gradeAll = async () => {
    const ungraded = items.filter((it) => !aiOutputs[it.submissionId]);
    if (!ungraded.length) return;
    setGradingAll(true);
    for (const it of ungraded) {
      await grade(it);
    }
    setGradingAll(false);
  };

  const approve = async (item: GradingQueueItem) => {
    const output = aiOutputs[item.submissionId];
    if (!output) return;
    setReviewing((s) => ({ ...s, [item.submissionId]: true }));
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
      setReviewedIds((s) => new Set([...s, item.submissionId]));
      toast.success("Grade approved and saved.");
    } catch {
      toast.error("Failed to save grade.");
    } finally {
      setReviewing((s) => ({ ...s, [item.submissionId]: false }));
    }
  };

  const submitOverride = async (item: GradingQueueItem) => {
    const rawScore = overrideScores[item.submissionId];
    const score = rawScore !== undefined ? Number(rawScore) : undefined;
    if (score !== undefined && (isNaN(score) || score < 0 || score > 100)) {
      toast.error("Score must be 0–100.");
      return;
    }
    const output = aiOutputs[item.submissionId];
    setReviewing((s) => ({ ...s, [item.submissionId]: true }));
    try {
      await reviewMutation.mutateAsync({
        kind: item.kind,
        sessionId: item.sessionId,
        taskId: item.taskId,
        submissionId: item.submissionId,
        status: "approved",
        score,
        reviewComment: output?.feedback,
      });
      setReviewedIds((s) => new Set([...s, item.submissionId]));
      setOverrideMode((s) => ({ ...s, [item.submissionId]: false }));
      toast.success("Override saved.");
    } catch {
      toast.error("Failed to save grade.");
    } finally {
      setReviewing((s) => ({ ...s, [item.submissionId]: false }));
    }
  };

  const items = queueQuery.data?.items ?? [];
  const visibleItems = items.filter((it) => !reviewedIds.has(it.submissionId));
  const gradedCount = Object.keys(aiOutputs).length;
  const approvedCount = reviewedIds.size;

  return (
    <DashboardShell>
      <TopBar title="AI Grading Assistant" subtitle="Auto-score short answers, then approve or override." showStreak={false} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Pending" value={String(queueQuery.data?.total ?? "—")} />
        <Stat label="AI-graded" value={gradedCount > 0 ? `${gradedCount}/${items.length}` : "—"} />
        <Stat label="Approved" value={approvedCount > 0 ? String(approvedCount) : "—"} />
        <Stat label="Avg score" value={avgScore(aiOutputs)} />
      </div>

      {queueQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="bg-card border-2 border-border rounded-3xl p-10 text-center chunky-shadow">
          <CheckCircle2 className="size-10 mx-auto text-primary/40 mb-3" strokeWidth={1.5} />
          <p className="font-black text-lg">All caught up</p>
          <p className="text-sm font-medium text-foreground/55 mt-1">No pending submissions in the grading queue.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground/60">{visibleItems.length} submission{visibleItems.length !== 1 ? "s" : ""} pending review.</p>
            <button
              onClick={gradeAll}
              disabled={gradingAll || visibleItems.every((it) => !!aiOutputs[it.submissionId])}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black text-sm disabled:opacity-50"
            >
              {gradingAll ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={2.5} />}
              Grade all with AI
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
                      <p className="font-black truncate">{item.studentName ?? "Unknown student"}</p>
                      <p className="text-sm font-bold text-foreground/65 mt-0.5 truncate">{item.taskTitle}</p>
                      <p className="text-[11px] font-medium text-foreground/45 mt-0.5 truncate">
                        {item.courseTitle} · {item.sessionTitle}
                      </p>
                    </div>
                    {output?.suggestedScore != null && !isOverride && (
                      <ScoreBadge score={output.suggestedScore} />
                    )}
                  </div>

                  {output ? (
                    <AiFeedbackPanel output={output} />
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/50 mb-1">
                      {item.hasText && <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">Text answer</span>}
                      {item.hasAttachment && <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">Attachment</span>}
                    </div>
                  )}

                  {isOverride && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={overrideScores[item.submissionId] ?? output?.suggestedScore ?? ""}
                        onChange={(e) => setOverrideScores((s) => ({ ...s, [item.submissionId]: e.target.value }))}
                        placeholder="Score (0–100)"
                        className="w-32 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => submitOverride(item)}
                        disabled={isReviewing}
                        className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isReviewing ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        Save override
                      </button>
                      <button
                        onClick={() => setOverrideMode((s) => ({ ...s, [item.submissionId]: false }))}
                        className="px-3 py-2 rounded-xl bg-muted font-bold text-xs text-foreground/60"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => grade(item)}
                      disabled={isGrading}
                      className="px-3 py-2 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGrading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {output ? "Regrade" : "Grade with AI"}
                    </button>

                    {output && !isOverride && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setOverrideMode((s) => ({ ...s, [item.submissionId]: true }));
                            setOverrideScores((s) => ({
                              ...s,
                              [item.submissionId]: String(output.suggestedScore ?? ""),
                            }));
                          }}
                          className="px-3 py-2 rounded-xl border-2 border-border bg-card hover:bg-muted font-bold text-xs flex items-center gap-1.5"
                        >
                          <Pencil className="size-3.5" /> Override score
                        </button>
                        <button
                          onClick={() => approve(item)}
                          disabled={isReviewing}
                          className="px-3 py-2 rounded-xl border-2 border-foreground bg-primary text-primary-foreground chunky-shadow font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isReviewing ? <Loader2 className="size-3.5 animate-spin" /> : <ThumbsUp className="size-3.5" />}
                          Approve
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
  return (
    <div className="mt-2 space-y-2">
      <div className="p-3 rounded-2xl bg-primary/5 border-2 border-primary/20 flex gap-3">
        <div className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 mt-0.5">
          <Bot className="size-3.5" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-foreground/85 leading-relaxed">{output.feedback}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {output.whatWentWell.length > 0 && (
          <FeedbackList icon={<CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />} items={output.whatWentWell} />
        )}
        {output.needsImprovement.length > 0 && (
          <FeedbackList icon={<AlertCircle className="size-3.5 text-accent-foreground shrink-0 mt-0.5" />} items={output.needsImprovement} />
        )}
      </div>
      {output.nextStep && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted text-xs font-medium text-foreground/70">
          <ChevronRight className="size-3.5 shrink-0 mt-0.5 text-foreground/40" />
          <span>{output.nextStep}</span>
        </div>
      )}
    </div>
  );
}

function FeedbackList({ icon, items }: { icon: React.ReactNode; items: string[] }) {
  return (
    <ul className="space-y-1 p-3 rounded-xl bg-muted/50 border border-border">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs font-medium text-foreground/75">
          {icon}{t}
        </li>
      ))}
    </ul>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "bg-primary/15 text-primary border-primary/40"
      : score >= 50
        ? "bg-accent/20 text-accent-foreground border-accent/40"
        : "bg-destructive/15 text-destructive border-destructive/40";
  return (
    <div className={`px-3 py-1.5 rounded-xl font-black text-sm border-2 shrink-0 ${cls}`}>
      {score}/100
    </div>
  );
}

function avgScore(outputs: Record<number, FeedbackDraftOutput>) {
  const scores = Object.values(outputs)
    .map((o) => o.suggestedScore)
    .filter((s): s is number => s !== null);
  if (!scores.length) return "—";
  return `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

// ─── Prototype fallback ───────────────────────────────────────────────────────

type PrototypeItem = {
  id: string;
  student: string;
  question: string;
  answer: string;
  expected: string;
  aiScore?: number;
  aiFeedback?: string;
  approved?: boolean;
};

const SEED: PrototypeItem[] = [
  { id: "1", student: "Mia Chen", question: "Define working memory.", expected: "A limited-capacity system that temporarily holds & manipulates info.", answer: "Working memory is a short-term store that lets us hold and use information for a few seconds while thinking." },
  { id: "2", student: "Leo Park", question: "Name the components of Baddeley's model.", expected: "Phonological loop, visuospatial sketchpad, central executive, episodic buffer.", answer: "The loop and sketchpad with a central executive." },
  { id: "3", student: "Ava Diaz", question: "Why is chunking useful?", expected: "Chunking groups items so capacity holds more information.", answer: "Because it makes things easier to remember by grouping them." },
  { id: "4", student: "Sam Cole", question: "What is the typical capacity of WM?", expected: "About 4 chunks (Cowan).", answer: "7 plus or minus 2." },
];

function PrototypeAiGradingPage() {
  const [items, setItems] = useState<PrototypeItem[]>(SEED);
  const [running, setRunning] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const grade = (id: string) => {
    setRunning(id);
    setTimeout(() => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...mockGrade(it) } : it)));
      setRunning(null);
    }, 700);
  };

  const gradeAll = () => {
    setBulk(true);
    setItems((prev) => prev.map((it) => ({ ...it, ...mockGrade(it) })));
    setTimeout(() => setBulk(false), 800);
  };

  const setApproved = (id: string, ok: boolean) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, approved: ok } : it)));

  const graded = items.filter((i) => i.aiScore !== undefined).length;
  const approved = items.filter((i) => i.approved === true).length;

  return (
    <DashboardShell>
      <TopBar title="AI Grading Assistant" subtitle="Auto-score short answers, then approve or override." showStreak={false} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Submissions" value={String(items.length)} />
        <Stat label="Auto-graded" value={`${graded}/${items.length}`} />
        <Stat label="Approved" value={String(approved)} />
        <Stat label="Avg confidence" value={graded ? "87%" : "—"} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-foreground/60">Review AI scores before publishing grades.</p>
        <button
          onClick={gradeAll}
          disabled={bulk}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black text-sm disabled:opacity-50"
        >
          {bulk ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" strokeWidth={2.5} />}
          Grade all with AI
        </button>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <article key={it.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-black text-base">{it.student}</p>
                <p className="text-sm font-bold text-foreground/70 mt-0.5">{it.question}</p>
              </div>
              {it.aiScore !== undefined && <ScoreBadge score={it.aiScore} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl border-2 border-border bg-background">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">Student answer</p>
                <p className="text-sm font-medium">{it.answer}</p>
              </div>
              <div className="p-3 rounded-2xl border-2 border-border bg-muted/50">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">Expected</p>
                <p className="text-sm font-medium">{it.expected}</p>
              </div>
            </div>

            {it.aiFeedback && (
              <div className="mt-3 p-3 rounded-2xl bg-primary/5 border-2 border-primary/20 flex gap-3">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
                  <Bot className="size-4" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-medium text-foreground/85">{it.aiFeedback}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => grade(it.id)}
                disabled={running === it.id}
                className="px-3 py-2 rounded-xl bg-muted hover:bg-foreground/10 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {running === it.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {it.aiScore !== undefined ? "Regrade" : "Grade with AI"}
              </button>

              {it.aiScore !== undefined && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setApproved(it.id, false)}
                    className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${
                      it.approved === false
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <ThumbsDown className="size-3.5" /> Override
                  </button>
                  <button
                    onClick={() => setApproved(it.id, true)}
                    className={`px-3 py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 ${
                      it.approved
                        ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <ThumbsUp className="size-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function mockGrade(it: PrototypeItem): Partial<PrototypeItem> {
  const a = new Set(it.answer.toLowerCase().split(/\W+/).filter(Boolean));
  const b = new Set(it.expected.toLowerCase().split(/\W+/).filter(Boolean));
  const overlap = [...a].filter((x) => b.has(x)).length;
  const score = Math.min(100, Math.round((overlap / b.size) * 110));
  const feedback =
    score >= 80
      ? "Strong answer that captures the core idea. Minor wording differences."
      : score >= 50
        ? "Partially correct. Missing one or two key components — see expected answer."
        : "Off-target. Recommend revisiting the lesson and resubmitting.";
  return { aiScore: score, aiFeedback: feedback };
}
