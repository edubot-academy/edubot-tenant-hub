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
  MessageSquare,
  Paperclip,
  Save,
  Send,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useInstructorGradingQueue,
  type GradingQueueItem,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/grading")({
  head: () => ({
    meta: [
      {
        title: i18n.t("gradingPage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Assignment Grading",
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

  if (context.mode !== "backend") {
    return <PrototypeGradingPage />;
  }

  return <BackendGradingPage />;
}

function BackendGradingPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [expanded, setExpanded] = useState<number | null>(null);

  const queueQuery = useInstructorGradingQueue(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  const items = queueQuery.data?.items ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pending = items.filter((item) => item.status === "submitted").length;

  const statusLabel = (status: string) => t(`gradingPage.status.${status}`, { defaultValue: status.replace("_", " ") });

  return (
    <DashboardShell>
      <TopBar
        title={t("gradingPage.topbar.title", { defaultValue: "Assignment Grading" })}
        subtitle={queueQuery.isLoading
          ? t("gradingPage.state.loading", { defaultValue: "Loading…" })
          : t("gradingPage.topbar.subtitleWithCounts", {
            total,
            pending,
            defaultValue: "{{total}} submissions · {{pending}} pending",
          })}
        showStreak={false}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black capitalize transition-colors ${
              statusFilter === status
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground/60 hover:bg-muted"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
        {queueQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-label={t("gradingPage.state.loadingQueue", { defaultValue: "Loading grading queue…" })}>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : queueQuery.isError ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto mb-3 size-9 text-destructive/60" />
            <p className="font-black text-destructive">{t("gradingPage.state.loadFailed", { defaultValue: "Failed to load grading queue" })}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-9 text-foreground/30" />
            <p className="font-black">{t("gradingPage.empty.title", { defaultValue: "Queue is empty" })}</p>
            <p className="mt-1 text-sm font-medium text-foreground/55">
              {t("gradingPage.empty.body", { defaultValue: "No submissions match this filter." })}
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
}: {
  item: GradingQueueItem;
  isExpanded: boolean;
  onToggle: () => void;
  statusLabel: string;
  locale: string;
}) {
  const { t } = useTranslation();
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <StatusIcon status={item.status} />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-4">
          <div className="min-w-0">
            <p className="font-black truncate">{item.taskTitle}</p>
            <p className="text-xs font-medium text-foreground/55 truncate">
              {item.studentName ?? item.studentEmail ?? t("gradingPage.labels.studentFallback", { id: item.studentId, defaultValue: "Student #{{id}}" })}
              {" · "}
              {item.courseTitle}
            </p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <StatusBadge status={item.status} label={statusLabel} />
            <p className="mt-1 text-[10px] font-medium text-foreground/40">
              {new Date(item.submittedAt).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-foreground/40">
          {item.hasAttachment && <Paperclip className="size-3.5" />}
          {item.hasText && <FileText className="size-3.5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 border-t-2 border-border bg-muted/20 space-y-3 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Detail label={t("gradingPage.detail.kind", { defaultValue: "Kind" })} value={item.kind} />
            <Detail label={t("gradingPage.detail.session", { defaultValue: "Session" })} value={item.sessionTitle} />
            <Detail label={t("gradingPage.detail.group", { defaultValue: "Group" })} value={`#${item.groupId}`} />
            <Detail label={t("gradingPage.detail.score", { defaultValue: "Score" })} value={item.score !== null ? String(item.score) : "—"} />
          </div>
          {item.reviewComment && (
            <div className="rounded-xl bg-card border-2 border-border px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1">
                {t("gradingPage.detail.reviewComment", { defaultValue: "Review comment" })}
              </p>
              <p className="text-sm font-medium text-foreground/80">{item.reviewComment}</p>
            </div>
          )}
        </div>
      )}
    </li>
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
      ? "bg-emerald-500/15 text-emerald-600"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : status === "needs_revision"
          ? "bg-amber-500/15 text-amber-700"
          : "bg-primary/15 text-primary";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border-2 border-border px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">{label}</p>
      <p className="mt-0.5 text-sm font-black truncate">{value}</p>
    </div>
  );
}

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
  const [feedback, setFeedback] = useState(t("gradingPage.prototype.feedbackSeed", { defaultValue: "Strong thesis and well-organized. Push your sources beyond the textbook in §3." }));
  const [comments, setComments] = useState<{ id: string; line: number; text: string }[]>([
    { id: "c1", line: 12, text: t("gradingPage.prototype.commentSeed", { defaultValue: "Nice framing — but cite Baddeley & Hitch (1974) here." }) },
  ]);
  const [newComment, setNewComment] = useState("");
  const current = protoSubmissions[idx];

  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const max = rubric.reduce((a, r) => a + r.max, 0);
  const grade = Math.round((total / max) * 100);

  return (
    <DashboardShell>
      <TopBar title={t("gradingPage.topbar.title", { defaultValue: "Assignment Grading" })} subtitle={t("gradingPage.prototype.subtitle", { defaultValue: "Essay 4 — Working Memory in Practice" })} showStreak={false} />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === 0} aria-label={t("gradingPage.actions.previous", { defaultValue: "Previous submission" })}>
            <ChevronLeft className="size-4" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-card border-2 border-border chunky-shadow">
            <p className="text-xs font-bold text-foreground/60">{t("gradingPage.prototype.position", { current: idx + 1, total: protoSubmissions.length, defaultValue: "{{current}} of {{total}}" })}</p>
            <p className="font-black">{current.name}</p>
          </div>
          <button onClick={() => setIdx((i) => Math.min(protoSubmissions.length - 1, i + 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === protoSubmissions.length - 1} aria-label={t("gradingPage.actions.next", { defaultValue: "Next submission" })}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border-2 border-border font-bold text-sm chunky-shadow">
            <Save className="size-4" /> {t("gradingPage.actions.saveDraft", { defaultValue: "Save draft" })}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <Send className="size-4" /> {t("gradingPage.actions.releaseGrade", { defaultValue: "Release grade" })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
          <div className="p-4 border-b-2 border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              <span className="font-black">{current.title}</span>
              <span className="text-foreground/50 font-bold">· {t("gradingPage.prototype.words", { count: current.words, defaultValue: "{{count}} words" })}</span>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border-2 border-border font-bold text-xs">
              <Paperclip className="size-3.5" /> {t("gradingPage.actions.attachments", { defaultValue: "Attachments" })}
            </button>
          </div>
          <article className="p-6 prose-sm max-h-[60vh] overflow-y-auto text-sm leading-relaxed font-medium space-y-3 text-foreground/85">
            {[
              t("gradingPage.prototype.sample.p1", { defaultValue: "Working memory is the cognitive system responsible for temporarily holding information available for processing." }),
              t("gradingPage.prototype.sample.p2", { defaultValue: "Baddeley and Hitch proposed a multi-component model that has since been refined." }),
              t("gradingPage.prototype.sample.p3", { defaultValue: "In classroom contexts, working-memory limits help explain why complex instructions fail." }),
              t("gradingPage.prototype.sample.p4", { defaultValue: "A short classroom case illustrates how step-by-step scaffolding improves completion." }),
              t("gradingPage.prototype.sample.p5", { defaultValue: "In sum, the working-memory framework offers practical design moves for teachers." }),
            ].map((paragraph, index) => (
              <p key={index} className={comments.some((comment) => comment.line === (index + 1) * 12) ? "bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 rounded" : ""}>
                {paragraph}
              </p>
            ))}
          </article>
        </section>

        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">{t("gradingPage.prototype.rubric", { defaultValue: "Rubric" })}</h3>
              <div className="text-right">
                <p className="text-2xl font-black font-mono">{total}<span className="text-foreground/40 text-base">/{max}</span></p>
                <p className="text-xs font-bold text-primary">{grade}%</p>
              </div>
            </div>
            <ul className="space-y-4">
              {rubric.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">{t(`gradingPage.rubric.${item.labelKey}`, { defaultValue: item.labelKey })}</span>
                    <span className="font-mono font-black text-xs">{scores[item.id]}/{item.max}</span>
                  </div>
                  <input
                    type="range" min={0} max={item.max} value={scores[item.id]}
                    onChange={(event) => setScores((currentScores) => ({ ...currentScores, [item.id]: Number(event.target.value) }))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                    {t(`gradingPage.descriptors.${item.descriptors[Math.min(3, Math.floor((scores[item.id] / item.max) * 4))]}`, { defaultValue: item.descriptors[0] })}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black mb-2">{t("gradingPage.prototype.overallFeedback", { defaultValue: "Overall feedback" })}</h3>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4}
              className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none" />
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-3">
              <MessageSquare className="size-4 text-primary" strokeWidth={2.5} /> {t("gradingPage.prototype.inlineComments", { defaultValue: "Inline comments" })}
            </h3>
            <ul className="space-y-2 mb-3">
              {comments.map((comment) => (
                <li key={comment.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-1">¶ {comment.line}</p>
                  <p className="text-sm font-medium">{comment.text}</p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder={t("gradingPage.prototype.addCommentPlaceholder", { defaultValue: "Add a comment…" })}
                className="flex-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-medium outline-none focus:border-primary" />
              <button onClick={() => {
                if (!newComment.trim()) return;
                setComments((currentComments) => [...currentComments, { id: crypto.randomUUID(), line: comments.length * 24 + 24, text: newComment }]);
                setNewComment("");
              }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">{t("gradingPage.actions.add", { defaultValue: "Add" })}</button>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
