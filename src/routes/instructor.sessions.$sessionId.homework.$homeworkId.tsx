import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  FileText,
  Download,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import i18n from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useHomeworkDetail,
  useHomeworkReviewRoster,
  useReviewRosterSubmission,
  useSubmissionComments,
  useAddSubmissionComment,
  type RosterEntry,
  type HomeworkDetail,
} from "@/lib/instructor/instructor-grading-api";
import { useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled, apiFetchRaw } from "@/lib/api/client";

export const Route = createFileRoute(
  "/instructor/sessions/$sessionId/homework/$homeworkId",
)({
  head: () => ({
    meta: [
      {
        title: i18n.t("homeworkDetail.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Homework",
        }),
      },
    ],
  }),
  component: HomeworkDetailPage,
});

const REVIEW_STATE_META: Record<
  RosterEntry["reviewState"],
  { labelKey: string; icon: typeof CheckCircle2; tone: string }
> = {
  pending_submission: {
    labelKey: "homeworkDetail.reviewState.pendingSubmission",
    icon: Clock,
    tone: "bg-muted text-foreground/60",
  },
  missing: {
    labelKey: "homeworkDetail.reviewState.missing",
    icon: AlertCircle,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  needs_review: {
    labelKey: "homeworkDetail.reviewState.needsReview",
    icon: Clock,
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  approved: {
    labelKey: "homeworkDetail.reviewState.approved",
    icon: CheckCircle2,
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  rejected: {
    labelKey: "homeworkDetail.reviewState.rejected",
    icon: XCircle,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  needs_revision: {
    labelKey: "homeworkDetail.reviewState.needsRevision",
    icon: AlertCircle,
    tone: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
};

function HomeworkDetailPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const { sessionId, homeworkId } = Route.useParams();
  const sid = Number(sessionId);
  const hid = Number(homeworkId);

  if (!isBackendApiEnabled() || context.mode !== "backend") {
    return (
      <DashboardShell>
        <div className="p-10 text-center text-sm font-medium text-foreground/50">
          {t("homeworkDetail.state.backendOnly")}
        </div>
      </DashboardShell>
    );
  }

  return <BackendHomeworkDetailPage sessionId={sid} homeworkId={hid} />;
}

function BackendHomeworkDetailPage({
  sessionId,
  homeworkId,
}: {
  sessionId: number;
  homeworkId: number;
}) {
  const { t } = useTranslation();
  const detailQuery = useHomeworkDetail(sessionId, homeworkId);
  const rosterQuery = useHomeworkReviewRoster(sessionId, homeworkId);
  const [gradingEntry, setGradingEntry] = useState<RosterEntry | null>(null);
  const [stateFilter, setStateFilter] = useState<
    RosterEntry["reviewState"] | "all"
  >("all");

  const homework = detailQuery.data;
  const roster = rosterQuery.data?.items ?? [];
  const summary = rosterQuery.data?.summary;

  const filtered = useMemo(() => {
    if (stateFilter === "all") return roster;
    return roster.filter((r) => r.reviewState === stateFilter);
  }, [roster, stateFilter]);

  const handleExportCsv = async () => {
    try {
      const resp = await apiFetchRaw(
        `/group-sessions/${sessionId}/homework/${homeworkId}/grades/export`,
      );
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homework-${homeworkId}-grades.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      toast.error(t("homeworkDetail.exportError", { defaultValue: "Export failed" }));
    }
  };

  return (
    <DashboardShell>
      <div className="mb-4">
        <Link
          to="/instructor/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {t("homeworkDetail.backToAssignments", { defaultValue: "Assignments" })}
        </Link>
      </div>

      {detailQuery.isLoading ? (
        <div className="h-28 rounded-3xl bg-card border-2 border-border animate-pulse mb-5" />
      ) : homework ? (
        <HomeworkHeader
          homework={homework}
          onExport={handleExportCsv}
        />
      ) : null}

      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
          {[
            { l: t("homeworkDetail.stats.total", { defaultValue: "Total" }), v: summary.total },
            { l: t("homeworkDetail.stats.needsReview", { defaultValue: "To Review" }), v: summary.needsReview },
            { l: t("homeworkDetail.stats.approved", { defaultValue: "Approved" }), v: summary.approved },
            { l: t("homeworkDetail.stats.rejected", { defaultValue: "Rejected" }), v: summary.rejected },
            { l: t("homeworkDetail.stats.needsRevision", { defaultValue: "Needs Revision" }), v: summary.needsRevision },
            { l: t("homeworkDetail.stats.missing", { defaultValue: "Missing" }), v: summary.missing },
          ].map((s) => (
            <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-3 chunky-shadow text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
              <p className="text-xl font-black font-mono mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "needs_review", "approved", "rejected", "needs_revision", "missing", "pending_submission"] as const).map((state) => {
          const label = state === "all"
            ? t("homeworkDetail.filters.all", { defaultValue: "All" })
            : t(REVIEW_STATE_META[state].labelKey);
          const count = state === "all" ? roster.length : roster.filter((r) => r.reviewState === state).length;
          return (
            <button
              key={state}
              onClick={() => setStateFilter(state)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                stateFilter === state
                  ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                  : "bg-card border-border hover:-translate-y-0.5"
              }`}
            >
              {label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {rosterQuery.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border-2 border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center text-sm font-medium text-foreground/50">
          {t("homeworkDetail.empty", { defaultValue: "No students match this filter." })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <RosterRow
              key={entry.studentId}
              entry={entry}
              sessionId={sessionId}
              homeworkId={homeworkId}
              maxScore={homework?.maxScore ?? null}
              rubricCriteria={homework?.rubricCriteria ?? null}
              isGrading={gradingEntry?.studentId === entry.studentId}
              onGrade={() =>
                setGradingEntry((prev) =>
                  prev?.studentId === entry.studentId ? null : entry,
                )
              }
              onReviewed={() => {
                setGradingEntry(null);
              }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function HomeworkHeader({
  homework,
  onExport,
}: {
  homework: HomeworkDetail;
  onExport: () => void;
}) {
  const { t, i18n: activeI18n } = useTranslation();
  const dueLabel = homework.dueAt
    ? new Date(homework.dueAt).toLocaleDateString(activeI18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : t("homeworkDetail.noDueDate", { defaultValue: "No due date" });

  return (
    <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow mb-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-black text-xl">{homework.title}</h1>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                homework.isPublished
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-muted text-foreground/60"
              }`}
            >
              {homework.isPublished
                ? t("homeworkDetail.status.live", { defaultValue: "Live" })
                : t("homeworkDetail.status.draft", { defaultValue: "Draft" })}
            </span>
          </div>
          {homework.description && (
            <div
              className="text-sm font-medium text-foreground/70 mb-2 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-black [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-1.5 [&_p]:mb-1.5 [&_a]:text-primary [&_a]:underline [&_s]:line-through [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: homework.description }}
            />
          )}
          <div className="flex items-center gap-4 text-xs font-bold text-foreground/60 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {dueLabel}
            </span>
            {homework.maxScore !== null && (
              <span className="font-mono">
                {t("homeworkDetail.maxScore", {
                  count: homework.maxScore,
                  defaultValue: "Max {{count}} pts",
                })}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border-2 border-border font-bold text-sm chunky-shadow hover:-translate-y-0.5 transition-transform shrink-0"
        >
          <Download className="size-4" />
          {t("homeworkDetail.exportCsv", { defaultValue: "Export CSV" })}
        </button>
      </div>
      {homework.rubricCriteria && homework.rubricCriteria.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-border">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">
            {t("homeworkDetail.rubric", { defaultValue: "Rubric" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {homework.rubricCriteria.map((c) => (
              <span
                key={c.name}
                className="px-2.5 py-1 rounded-lg bg-muted text-xs font-bold border border-border"
              >
                {c.name}{" "}
                <span className="text-foreground/50">({c.maxPoints} pts)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RosterRow({
  entry,
  sessionId,
  homeworkId,
  maxScore,
  rubricCriteria,
  isGrading,
  onGrade,
  onReviewed,
}: {
  entry: RosterEntry;
  sessionId: number;
  homeworkId: number;
  maxScore: number | null;
  rubricCriteria: HomeworkDetail["rubricCriteria"];
  isGrading: boolean;
  onGrade: () => void;
  onReviewed: () => void;
}) {
  const { t } = useTranslation();
  const meta = REVIEW_STATE_META[entry.reviewState];
  const Icon = meta.icon;

  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="size-9 rounded-xl bg-muted grid place-items-center shrink-0">
          <Users className="size-4 text-foreground/60" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">
            {entry.fullName ?? entry.email ?? t("homeworkDetail.labels.studentFallback", { id: entry.studentId })}
          </p>
          {entry.email && entry.fullName && (
            <p className="text-xs font-medium text-foreground/50 truncate">
              {entry.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          {entry.isLate && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {t("homeworkDetail.late", { defaultValue: "Late" })}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${meta.tone}`}
          >
            <Icon className="size-3" strokeWidth={3} />
            {t(meta.labelKey)}
          </span>
          {entry.submission?.score != null && (
            <span className="font-black font-mono text-sm w-14 text-right">
              {entry.submission.score}
              {maxScore !== null && (
                <span className="text-foreground/40 font-medium">
                  /{maxScore}
                </span>
              )}
            </span>
          )}
          {entry.hasSubmission && (
            <button
              onClick={onGrade}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                isGrading
                  ? "bg-primary text-primary-foreground border-primary chunky-shadow"
                  : "bg-card border-border hover:-translate-y-0.5"
              }`}
            >
              {isGrading ? (
                <>
                  <ChevronUp className="size-3.5" />
                  {t("homeworkDetail.close", { defaultValue: "Close" })}
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  {t("homeworkDetail.grade", { defaultValue: "Grade" })}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isGrading && entry.submission && (
        <GradingPanel
          entry={entry}
          sessionId={sessionId}
          homeworkId={homeworkId}
          maxScore={maxScore}
          rubricCriteria={rubricCriteria}
          onReviewed={onReviewed}
        />
      )}
    </div>
  );
}

function GradingPanel({
  entry,
  sessionId,
  homeworkId,
  maxScore,
  rubricCriteria,
  onReviewed,
}: {
  entry: RosterEntry;
  sessionId: number;
  homeworkId: number;
  maxScore: number | null;
  rubricCriteria: HomeworkDetail["rubricCriteria"];
  onReviewed: () => void;
}) {
  const { t, i18n: activeI18n } = useTranslation();
  const sub = entry.submission!;

  const [score, setScore] = useState<string>(sub.score != null ? String(sub.score) : "");
  const [comment, setComment] = useState(sub.reviewComment ?? "");
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(
    sub.criteriaScores ?? {},
  );

  const reviewMutation = useReviewRosterSubmission(sessionId, homeworkId);
  const commentsQuery = useSubmissionComments(sessionId, homeworkId, sub.id);
  const addCommentMutation = useAddSubmissionComment(sessionId, homeworkId);
  const [newComment, setNewComment] = useState("");

  const handleDownloadAttachment = async () => {
    try {
      const resp = await apiFetchRaw(
        `/group-sessions/${sessionId}/homework/${homeworkId}/submissions/${sub.id}/attachment`,
      );
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attachment-${sub.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      toast.error(t("homeworkDetail.panel.attachmentError", { defaultValue: "Failed to download attachment" }));
    }
  };

  const handleReview = async (status: "approved" | "rejected" | "needs_revision") => {
    const parsedScore = score !== "" ? Number(score) : undefined;
    if (parsedScore !== undefined && isNaN(parsedScore)) {
      toast.error(t("homeworkDetail.scoreInvalid", { defaultValue: "Score must be a valid number" }));
      return;
    }
    try {
      await reviewMutation.mutateAsync({
        submissionId: sub.id,
        status,
        score: parsedScore,
        reviewComment: comment || undefined,
        criteriaScores: Object.keys(criteriaScores).length > 0 ? criteriaScores : undefined,
      });
      toast.success(t("homeworkDetail.reviewSuccess", { defaultValue: "Review saved" }));
      onReviewed();
    } catch {
      toast.error(t("homeworkDetail.reviewError", { defaultValue: "Failed to save review" }));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ submissionId: sub.id, body: newComment.trim() });
      setNewComment("");
    } catch {
      toast.error(t("homeworkDetail.commentError", { defaultValue: "Failed to add comment" }));
    }
  };

  return (
    <div className="border-t-2 border-border bg-muted/20 p-5 space-y-5">
      {sub.answerText && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">
            {t("homeworkDetail.panel.answer", { defaultValue: "Student Answer" })}
          </p>
          <div className="bg-background border-2 border-border rounded-2xl p-4 text-sm font-medium leading-relaxed text-foreground/80 max-h-48 overflow-y-auto">
            {sub.answerText}
          </div>
        </div>
      )}

      {sub.attachmentUrl && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">
            {t("homeworkDetail.panel.attachment", { defaultValue: "Attachment" })}
          </p>
          <button
            onClick={handleDownloadAttachment}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border-2 border-border font-bold text-sm hover:-translate-y-0.5 transition-transform chunky-shadow"
          >
            <FileText className="size-4 text-primary" />
            {t("homeworkDetail.panel.viewAttachment", { defaultValue: "View Attachment" })}
          </button>
        </div>
      )}

      {rubricCriteria && rubricCriteria.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-3">
            {t("homeworkDetail.panel.rubric", { defaultValue: "Rubric Scoring" })}
          </p>
          <div className="space-y-3">
            {rubricCriteria.map((criterion) => (
              <div key={criterion.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{criterion.name}</span>
                  <span className="font-mono text-xs font-black">
                    {criteriaScores[criterion.name] ?? 0}/{criterion.maxPoints}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={criterion.maxPoints}
                  value={criteriaScores[criterion.name] ?? 0}
                  onChange={(e) =>
                    setCriteriaScores((prev) => ({
                      ...prev,
                      [criterion.name]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block mb-1.5">
            {t("homeworkDetail.panel.score", { defaultValue: "Score" })}
            {maxScore !== null && (
              <span className="text-foreground/40 normal-case font-medium ml-1">
                (max {maxScore})
              </span>
            )}
          </label>
          <input
            type="number"
            min={0}
            max={maxScore ?? undefined}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="—"
            className="w-full px-3 py-2 bg-background border-2 border-border rounded-xl text-sm font-black font-mono outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block mb-1.5">
            {t("homeworkDetail.panel.feedback", { defaultValue: "Feedback" })}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("homeworkDetail.panel.feedbackPlaceholder", {
              defaultValue: "Write feedback for the student…",
            })}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleReview("approved")}
          disabled={reviewMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm border-2 border-emerald-600 chunky-shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          <CheckCircle2 className="size-4" strokeWidth={2.5} />
          {t("homeworkDetail.panel.approve", { defaultValue: "Approve" })}
        </button>
        <button
          onClick={() => handleReview("needs_revision")}
          disabled={reviewMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-black text-sm border-2 border-amber-600 chunky-shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          <RotateCcw className="size-4" strokeWidth={2.5} />
          {t("homeworkDetail.panel.requestRevision", { defaultValue: "Request Revision" })}
        </button>
        <button
          onClick={() => handleReview("rejected")}
          disabled={reviewMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-black text-sm border-2 border-rose-600 chunky-shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          <XCircle className="size-4" strokeWidth={2.5} />
          {t("homeworkDetail.panel.reject", { defaultValue: "Reject" })}
        </button>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2 flex items-center gap-1.5">
          <MessageSquare className="size-3.5" />
          {t("homeworkDetail.panel.comments", { defaultValue: "Comments" })}
        </p>
        {commentsQuery.isLoading ? (
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="space-y-2 mb-3">
            {(commentsQuery.data ?? []).map((c) => (
              <div
                key={c.id}
                className="bg-background border-2 border-border rounded-xl px-3 py-2"
              >
                <p className="text-xs font-bold text-foreground/50 mb-0.5">
                  {new Date(c.createdAt).toLocaleDateString(activeI18n.language)}
                </p>
                <p className="text-sm font-medium">{c.body}</p>
              </div>
            ))}
            {(commentsQuery.data?.length ?? 0) === 0 && (
              <p className="text-xs font-medium text-foreground/40">
                {t("homeworkDetail.panel.noComments", { defaultValue: "No comments yet." })}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !addCommentMutation.isPending && handleAddComment()}
            placeholder={t("homeworkDetail.panel.commentPlaceholder", {
              defaultValue: "Add a comment…",
            })}
            className="flex-1 px-3 py-2 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary"
          />
          <button
            onClick={handleAddComment}
            disabled={addCommentMutation.isPending || !newComment.trim()}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
