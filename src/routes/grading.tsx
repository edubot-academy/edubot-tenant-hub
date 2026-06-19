import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Save,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import "@/lib/grading/grading-i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled } from "@/lib/api/client";
import i18n from "@/lib/i18n";
import {
  useInstructorGradingQueue,
  useReviewSubmission,
  type GradingQueueItem,
  type ReviewSubmissionPayload,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/grading")({
  head: () => ({
    meta: [
      {
        title: i18n.t("gradingPage.metaTitle", {
          appName: i18n.t("app.name"),
        }),
      },
    ],
  }),
  component: GradingPage,
});

const STATUS_FILTERS = ["all", "submitted", "approved", "rejected", "needs_revision"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function GradingPage() {
  const { context } = useAppContext();
  if (!isBackendApiEnabled() || context.mode !== "backend") return <PrototypeGradingPage />;
  return <BackendGradingPage />;
}

function BackendGradingPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [expanded, setExpanded] = useState<number | null>(null);

  const queueQuery = useInstructorGradingQueue(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );
  const reviewMutation = useReviewSubmission();

  const pendingQuery = useInstructorGradingQueue({ status: "submitted" });
  const items = queueQuery.data?.items ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pending = pendingQuery.data?.total ?? 0;

  const statusLabel = (status: string) =>
    t(`gradingPage.status.${status}`, { defaultValue: status.replace("_", " ") });

  async function handleReview(payload: ReviewSubmissionPayload) {
    await reviewMutation.mutateAsync(payload);
  }

  const STATUS_META: Record<StatusFilter, { label: string; color: string }> = {
    all: { label: t("gradingPage.filter.all", { defaultValue: "All" }), color: "border-border bg-card text-foreground/70 hover:bg-muted" },
    submitted: { label: t("gradingPage.filter.submitted", { defaultValue: "Submitted" }), color: "border-primary/40 hover:bg-primary/10" },
    approved: { label: t("gradingPage.filter.approved", { defaultValue: "Approved" }), color: "border-emerald-500/40 hover:bg-emerald-500/10" },
    rejected: { label: t("gradingPage.filter.rejected", { defaultValue: "Rejected" }), color: "border-destructive/40 hover:bg-destructive/10" },
    needs_revision: { label: t("gradingPage.filter.needsRevision", { defaultValue: "Needs Revision" }), color: "border-amber-500/40 hover:bg-amber-500/10" },
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("gradingPage.topbar.title")}
        subtitle={
          queueQuery.isLoading
            ? t("gradingPage.state.loading")
            : t("gradingPage.topbar.subtitleWithCounts", { total, pending })
        }
        showStreak={false}
      />

      {/* Status filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const meta = STATUS_META[s];
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setExpanded(null); }}
              className={`rounded-xl border-2 px-3.5 py-1.5 text-xs font-black capitalize transition-all ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : meta.color
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border-2 border-border bg-card dark:bg-card/80 overflow-hidden shadow-sm dark:shadow-none dark:[box-shadow:0_0_0_1px_oklch(0.96_0.005_80_/_0.08)]">
        {queueQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-label={t("gradingPage.state.loadingQueue")}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : queueQuery.isError ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto mb-3 size-9 text-destructive/60" />
            <p className="font-black text-destructive">{t("gradingPage.state.loadFailed")}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-9 text-foreground/30" />
            <p className="font-black">{t("gradingPage.empty.title")}</p>
            <p className="mt-1 text-sm font-medium text-foreground/55">
              {t("gradingPage.empty.body")}
            </p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-border">
            {items.map((item) => (
              <SubmissionRow
                key={`${item.kind}-${item.submissionId}`}
                item={item}
                isExpanded={expanded === item.submissionId}
                onToggle={() =>
                  setExpanded((prev) =>
                    prev === item.submissionId ? null : item.submissionId,
                  )
                }
                statusLabel={statusLabel(item.status)}
                locale={activeI18n.language}
                onReview={handleReview}
              />
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}

function SubmissionRow({
  item,
  isExpanded,
  onToggle,
  statusLabel,
  locale,
  onReview,
}: {
  item: GradingQueueItem;
  isExpanded: boolean;
  onToggle: () => void;
  statusLabel: string;
  locale: string;
  onReview: (payload: ReviewSubmissionPayload) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<"approved" | "rejected" | "needs_revision" | null>(null);

  useEffect(() => {
    if (isExpanded) {
      setScore(item.score !== null ? String(item.score) : "");
      setComment(item.reviewComment ?? "");
    }
  // Reset only when this row is opened or a different submission is shown —
  // not on every background refetch that touches item.score/reviewComment.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, item.submissionId]);

  async function handleAction(status: "approved" | "rejected" | "needs_revision") {
    setSubmitting(status);
    try {
      await onReview({
        kind: item.kind,
        sessionId: item.sessionId,
        taskId: item.taskId,
        submissionId: item.submissionId,
        status,
        score: score ? Number(score) : undefined,
        reviewComment: comment.trim() || undefined,
      });
      const labels: Record<string, string> = {
        approved: t("gradingPage.toast.approved", { defaultValue: "Submission approved" }),
        rejected: t("gradingPage.toast.rejected", { defaultValue: "Submission rejected" }),
        needs_revision: t("gradingPage.toast.needsRevision", { defaultValue: "Sent back for revision" }),
      };
      toast.success(labels[status]);
    } catch {
      toast.error(t("gradingPage.toast.reviewFailed", { defaultValue: "Failed to submit review" }));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <li>
      {/* Row header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${isExpanded ? "bg-muted/40 dark:bg-muted/20" : "hover:bg-muted/30 dark:hover:bg-muted/15"}`}
      >
        <StatusIcon status={item.status} />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-4">
          <div className="min-w-0">
            <p className="font-black truncate">{item.taskTitle}</p>
            <p className="text-xs font-medium text-foreground/55 truncate">
              {item.studentName ?? item.studentEmail ?? t("gradingPage.labels.studentFallback", { id: item.studentId })}
              {" · "}
              {item.courseTitle}
            </p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <StatusBadge status={item.status} label={statusLabel} />
            <p className="mt-1 text-[10px] font-medium text-foreground/40">
              {new Date(item.submittedAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-foreground/40">
          {item.hasAttachment && <Paperclip className="size-3.5" />}
          {item.hasText && <FileText className="size-3.5" />}
          <div className={`size-2 rounded-full ml-1 transition-all duration-200 ${isExpanded ? "rotate-180 bg-primary/60" : "bg-foreground/20"}`} />
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t-2 border-border bg-muted/20 dark:bg-[oklch(0.18_0.05_255_/_0.6)]">
          {/* Metadata */}
          <div className="px-5 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Detail label={t("gradingPage.detail.kind")} value={item.kind} />
            <Detail label={t("gradingPage.detail.session")} value={item.sessionTitle} />
            <Detail label={t("gradingPage.detail.group")} value={`#${item.groupId}`} />
            <Detail label={t("gradingPage.detail.score")} value={item.score !== null ? String(item.score) : "—"} />
          </div>

          {/* Grade form */}
          <div className="px-5 pb-5 space-y-3">
            <div className="flex gap-3">
              {/* Score input */}
              <div className="w-28 shrink-0 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-foreground/45">
                  {t("gradingPage.grade.score", { defaultValue: "Score" })}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Feedback textarea */}
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-foreground/45">
                  {t("gradingPage.grade.feedback", { defaultValue: "Feedback / comment" })}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("gradingPage.grade.feedbackPlaceholder", { defaultValue: "Leave feedback for the student…" })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2">
              <ActionButton
                status="rejected"
                label={t("gradingPage.actions.reject", { defaultValue: "Reject" })}
                icon={<XCircle className="size-3.5" />}
                submitting={submitting}
                onClick={() => handleAction("rejected")}
                className="border-2 border-destructive/30 text-destructive hover:bg-destructive/10 dark:border-destructive/40 dark:hover:bg-destructive/15"
              />
              <ActionButton
                status="needs_revision"
                label={t("gradingPage.actions.needsRevision", { defaultValue: "Needs Revision" })}
                icon={<RotateCcw className="size-3.5" />}
                submitting={submitting}
                onClick={() => handleAction("needs_revision")}
                className="border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:border-amber-500/40 dark:hover:bg-amber-500/15"
              />
              <ActionButton
                status="approved"
                label={t("gradingPage.actions.approve", { defaultValue: "Approve" })}
                icon={<CheckCircle2 className="size-3.5" />}
                submitting={submitting}
                onClick={() => handleAction("approved")}
                className="border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15 font-black"
              />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function ActionButton({
  status,
  label,
  icon,
  submitting,
  onClick,
  className,
}: {
  status: "approved" | "rejected" | "needs_revision";
  label: string;
  icon: React.ReactNode;
  submitting: string | null;
  onClick: () => void;
  className: string;
}) {
  const isThis = submitting === status;
  const isAny = submitting !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isAny}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      {isThis ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function StatusIcon({ status }: { status: GradingQueueItem["status"] }) {
  if (status === "approved") return <CheckCircle2 className="size-5 shrink-0 text-emerald-500" strokeWidth={2.5} />;
  if (status === "rejected") return <XCircle className="size-5 shrink-0 text-destructive" strokeWidth={2.5} />;
  if (status === "needs_revision") return <AlertCircle className="size-5 shrink-0 text-amber-500" strokeWidth={2.5} />;
  if (status === "submitted") return <Clock className="size-5 shrink-0 text-primary" strokeWidth={2.5} />;
  return <Circle className="size-5 shrink-0 text-foreground/30" />;
}

function StatusBadge({ status, label }: { status: GradingQueueItem["status"]; label: string }) {
  const cls =
    status === "approved"
      ? "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/25"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive dark:bg-destructive/20 ring-1 ring-destructive/25"
        : status === "needs_revision"
          ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/25"
          : "bg-primary/15 text-primary dark:bg-primary/20 ring-1 ring-primary/25";
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card dark:bg-muted/30 border-2 border-border px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">{label}</p>
      <p className="mt-0.5 text-sm font-black truncate">{value}</p>
    </div>
  );
}

/* ─── Prototype mode (unchanged logic, improved visuals) ──────────────────── */

const rubric = [
  { id: "r1", labelKey: "argument", max: 25, descriptors: ["unclear", "weak", "clear", "sophisticated"] },
  { id: "r2", labelKey: "evidence", max: 25, descriptors: ["none", "limited", "appropriate", "rich"] },
  { id: "r3", labelKey: "structure", max: 20, descriptors: ["disorganized", "some", "logical", "polished"] },
  { id: "r4", labelKey: "mechanics", max: 15, descriptors: ["manyErrors", "someErrors", "mostlyClean", "polished"] },
  { id: "r5", labelKey: "originality", max: 15, descriptors: ["derivative", "someInsight", "insightful", "highlyOriginal"] },
];

const protoSubmissions = [
  { id: "s1", name: "Mia Chen", title: "Working memory in classrooms", words: 1240, status: "Pending" },
  { id: "s2", name: "Ben Ortiz", title: "Phonological loop — case study", words: 980, status: "Pending" },
  { id: "s3", name: "Noor Said", title: "Chunking strategies", words: 1410, status: "Graded" },
];

function PrototypeGradingPage() {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ r1: 18, r2: 16, r3: 14, r4: 12, r5: 10 });
  const [feedback, setFeedback] = useState(t("gradingPage.prototype.feedbackSeed"));
  const [comments, setComments] = useState<{ id: string; line: number; text: string }[]>([
    { id: "c1", line: 12, text: t("gradingPage.prototype.commentSeed") },
  ]);
  const [newComment, setNewComment] = useState("");
  const current = protoSubmissions[idx];

  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const max = rubric.reduce((a, r) => a + r.max, 0);
  const grade = Math.round((total / max) * 100);

  return (
    <DashboardShell>
      <TopBar title={t("gradingPage.topbar.title")} subtitle={t("gradingPage.prototype.subtitle")} showStreak={false} />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === 0} aria-label={t("gradingPage.actions.previous")}>
            <ChevronLeft className="size-4" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-card border-2 border-border chunky-shadow">
            <p className="text-xs font-bold text-foreground/60">{t("gradingPage.prototype.position", { current: idx + 1, total: protoSubmissions.length })}</p>
            <p className="font-black">{current.name}</p>
          </div>
          <button onClick={() => setIdx((i) => Math.min(protoSubmissions.length - 1, i + 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === protoSubmissions.length - 1} aria-label={t("gradingPage.actions.next")}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border-2 border-border font-bold text-sm chunky-shadow">
            <Save className="size-4" /> {t("gradingPage.actions.saveDraft")}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <Send className="size-4" /> {t("gradingPage.actions.releaseGrade")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
          <div className="p-4 border-b-2 border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              <span className="font-black">{current.title}</span>
              <span className="text-foreground/50 font-bold">· {t("gradingPage.prototype.words", { count: current.words })}</span>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border-2 border-border font-bold text-xs">
              <Paperclip className="size-3.5" /> {t("gradingPage.actions.attachments")}
            </button>
          </div>
          <article className="p-6 prose-sm max-h-[60vh] overflow-y-auto text-sm leading-relaxed font-medium space-y-3 text-foreground/85">
            {[
              t("gradingPage.prototype.sample.p1"),
              t("gradingPage.prototype.sample.p2"),
              t("gradingPage.prototype.sample.p3"),
              t("gradingPage.prototype.sample.p4"),
              t("gradingPage.prototype.sample.p5"),
            ].map((paragraph, index) => (
              <p key={index} className={comments.some((c) => c.line === (index + 1) * 12) ? "bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 rounded" : ""}>
                {paragraph}
              </p>
            ))}
          </article>
        </section>

        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">{t("gradingPage.prototype.rubric")}</h3>
              <div className="text-right">
                <p className="text-2xl font-black font-mono">{total}<span className="text-foreground/40 text-base">/{max}</span></p>
                <p className="text-xs font-bold text-primary">{grade}%</p>
              </div>
            </div>
            <ul className="space-y-4">
              {rubric.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">{t(`gradingPage.rubric.${item.labelKey}`)}</span>
                    <span className="font-mono font-black text-xs">{scores[item.id]}/{item.max}</span>
                  </div>
                  <input
                    type="range" min={0} max={item.max} value={scores[item.id]}
                    onChange={(e) => setScores((s) => ({ ...s, [item.id]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                    {t(`gradingPage.descriptors.${item.descriptors[Math.min(3, Math.floor((scores[item.id] / item.max) * 4))]}`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black mb-2">{t("gradingPage.prototype.overallFeedback")}</h3>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4}
              className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none" />
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-3">
              <MessageSquare className="size-4 text-primary" strokeWidth={2.5} /> {t("gradingPage.prototype.inlineComments")}
            </h3>
            <ul className="space-y-2 mb-3">
              {comments.map((c) => (
                <li key={c.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700/60 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-1">¶ {c.line}</p>
                  <p className="text-sm font-medium">{c.text}</p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t("gradingPage.prototype.addCommentPlaceholder")}
                className="flex-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-medium outline-none focus:border-primary" />
              <button onClick={() => {
                if (!newComment.trim()) return;
                setComments((cs) => [...cs, { id: crypto.randomUUID(), line: cs.length * 24 + 24, text: newComment }]);
                setNewComment("");
              }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">{t("gradingPage.actions.add")}</button>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
