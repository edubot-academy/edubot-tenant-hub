import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  Paperclip,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useInstructorGradingQueue,
  type GradingQueueItem,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/assistant/grading")({
  head: () => ({ meta: [{ title: "QuestLMS — Grading Queue" }] }),
  component: AssistantGradingPage,
});

const STATUS_FILTERS = ["all", "submitted", "approved", "rejected", "needs_revision"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function AssistantGradingPage() {
  const { context } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [expanded, setExpanded] = useState<number | null>(null);

  const queueQuery = useInstructorGradingQueue(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="Grading Queue" subtitle="Prototype mode uses a demo grading queue." showStreak={false} />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses a demo grading queue.
        </section>
      </DashboardShell>
    );
  }

  const items = queueQuery.data?.items ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pending = items.filter((i) => i.status === "submitted").length;

  return (
    <DashboardShell>
      <TopBar
        title="Grading Queue"
        subtitle={queueQuery.isLoading ? "Loading…" : `${total} submission${total !== 1 ? "s" : ""} · ${pending} pending`}
        showStreak={false}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black capitalize transition-colors ${
              statusFilter === s
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground/60 hover:bg-muted"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
        {queueQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : queueQuery.isError ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto mb-3 size-9 text-destructive/60" />
            <p className="font-black text-destructive">Failed to load grading queue</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-9 text-foreground/30" />
            <p className="font-black">Queue is empty</p>
            <p className="mt-1 text-sm font-medium text-foreground/55">
              No submissions match this filter.
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
}: {
  item: GradingQueueItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
              {item.studentName ?? item.studentEmail ?? `Student #${item.studentId}`}
              {" · "}
              {item.courseTitle}
            </p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <StatusBadge status={item.status} />
            <p className="mt-1 text-[10px] font-medium text-foreground/40">
              {new Date(item.submittedAt).toLocaleDateString(undefined, {
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
            <Detail label="Kind" value={item.kind} />
            <Detail label="Session" value={item.sessionTitle} />
            <Detail label="Group" value={`#${item.groupId}`} />
            <Detail
              label="Score"
              value={item.score !== null ? String(item.score) : "—"}
            />
          </div>
          {item.reviewComment && (
            <div className="rounded-xl bg-card border-2 border-border px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1">
                Review comment
              </p>
              <p className="text-sm font-medium text-foreground/80">
                {item.reviewComment}
              </p>
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

function StatusBadge({ status }: { status: GradingQueueItem["status"] }) {
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
      {status.replace("_", " ")}
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
