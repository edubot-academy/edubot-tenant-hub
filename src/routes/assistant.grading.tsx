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
import { useTranslation } from "react-i18next";

import "@/lib/assistant/assistant-i18n";
import "@/lib/grading/grading-i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useInstructorGradingQueue,
  type GradingQueueItem,
} from "@/lib/instructor/instructor-grading-api";

export const Route = createFileRoute("/assistant/grading")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.assistant.grading")}` }] }),
  component: AssistantGradingPage,
});

const STATUS_FILTERS = ["all", "submitted", "approved", "rejected", "needs_revision"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function AssistantGradingPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { context } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [expanded, setExpanded] = useState<number | null>(null);
  const locale = activeI18n.resolvedLanguage || activeI18n.language;

  const queueQuery = useInstructorGradingQueue(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title={t("assistantGradingPage.title")} subtitle={t("assistantGradingPage.prototype")} showStreak={false} />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("assistantGradingPage.prototype")}
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
        title={t("assistantGradingPage.title")}
        subtitle={queueQuery.isLoading ? t("gradingPage.state.loading") : t("assistantGradingPage.subtitleWithCounts", { total, pending })}
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
            {t(`gradingPage.status.${status}`)}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
        {queueQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-label={t("gradingPage.state.loadingQueue")}>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted" />
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
                locale={locale}
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
  locale,
}: {
  item: GradingQueueItem;
  isExpanded: boolean;
  onToggle: () => void;
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
              {item.studentName ?? item.studentEmail ?? t("gradingPage.labels.studentFallback", { id: item.studentId })}
              {" · "}
              {item.courseTitle}
            </p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <StatusBadge status={item.status} />
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
            <Detail label={t("gradingPage.detail.kind")} value={item.kind} />
            <Detail label={t("gradingPage.detail.session")} value={item.sessionTitle} />
            <Detail label={t("gradingPage.detail.group")} value={`#${item.groupId}`} />
            <Detail
              label={t("gradingPage.detail.score")}
              value={item.score !== null ? String(item.score) : "—"}
            />
          </div>
          {item.reviewComment && (
            <div className="rounded-xl bg-card border-2 border-border px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1">
                {t("gradingPage.detail.reviewComment")}
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
  const { t } = useTranslation();
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
      {t(`gradingPage.status.${status}`)}
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
