import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Loader2, MessageSquare, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useDiscussionThreads,
  useDiscussionThread,
  useCreateReply,
  usePatchThread,
  useDeleteThread,
  type DiscussionThread,
} from "@/lib/discussions-api";

export const Route = createFileRoute("/instructor/discussions")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorDiscussions.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Discussions",
        }),
      },
    ],
  }),
  component: DiscussionsPage,
});

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(iso: string | null | undefined, language: string) {
  if (!iso) return "";
  const diffMs = new Date(iso).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });

  if (absMs < 60_000) return formatter.format(0, "minute");
  const mins = Math.round(diffMs / 60_000);
  if (Math.abs(mins) < 60) return formatter.format(mins, "minute");
  const hrs = Math.round(diffMs / 3_600_000);
  if (Math.abs(hrs) < 24) return formatter.format(hrs, "hour");
  return formatter.format(Math.round(diffMs / 86_400_000), "day");
}

function DiscussionsPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar
          title={t("instructorDiscussions.topbar.title", { defaultValue: "Discussions" })}
          subtitle={t("instructorDiscussions.topbar.subtitle", { defaultValue: "Answer questions and moderate class forums" })}
        />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorDiscussions.state.prototype", { defaultValue: "Prototype mode — connect a backend to see real discussion threads." })}
        </section>
      </DashboardShell>
    );
  }
  return <BackendDiscussionsPage />;
}

type StatusFilter = "all" | "open" | "pinned" | "resolved";

function BackendDiscussionsPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const threadsQuery = useDiscussionThreads({ q: debouncedQ || undefined, status: status === "all" ? undefined : status });
  const threadDetailQuery = useDiscussionThread(selectedId);
  const replyMutation = useCreateReply(selectedId);
  const patchMutation = usePatchThread();
  const deleteMutation = useDeleteThread();

  const threads = threadsQuery.data ?? [];
  const detail = threadDetailQuery.data ?? null;

  useEffect(() => {
    if (selectedId === null && threads.length > 0) setSelectedId(threads[0].id);
  }, [threads.length, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.replies.length]);

  const sendReply = async () => {
    if (!reply.trim() || selectedId === null) return;
    const text = reply.trim();
    setReply("");
    try {
      await replyMutation.mutateAsync(text);
    } catch {
      toast.error(t("instructorDiscussions.toast.replyFailed", { defaultValue: "Failed to post reply." }));
      setReply(text);
    }
  };

  const togglePin = async (thread: DiscussionThread) => {
    try {
      await patchMutation.mutateAsync({ id: thread.id, isPinned: !thread.isPinned });
    } catch {
      toast.error(t("instructorDiscussions.toast.updateFailed", { defaultValue: "Failed to update thread." }));
    }
  };

  const toggleResolve = async (thread: DiscussionThread) => {
    try {
      await patchMutation.mutateAsync({ id: thread.id, isResolved: !thread.isResolved });
    } catch {
      toast.error(t("instructorDiscussions.toast.updateFailed", { defaultValue: "Failed to update thread." }));
    }
  };

  const deleteThread = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      toast.success(t("instructorDiscussions.toast.deleted", { defaultValue: "Thread deleted." }));
    } catch {
      toast.error(t("instructorDiscussions.toast.deleteFailed", { defaultValue: "Failed to delete thread." }));
    }
  };

  const statusFilters: StatusFilter[] = ["all", "open", "pinned", "resolved"];

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorDiscussions.topbar.title", { defaultValue: "Discussions" })}
        subtitle={t("instructorDiscussions.topbar.subtitle", { defaultValue: "Answer questions and moderate class forums" })}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b-2 border-border space-y-2">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
              <Search className="size-4 text-foreground/50 shrink-0" />
              <input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => setDebouncedQ(event.target.value), 400);
                }}
                placeholder={t("instructorDiscussions.search.placeholder", { defaultValue: "Search threads…" })}
                className="bg-transparent outline-none py-2 text-sm font-medium w-full"
              />
            </div>
            <div className="flex gap-1.5">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatus(filter)}
                  className={`flex-1 rounded-lg py-1 text-[10px] font-black uppercase tracking-wider ${
                    status === filter ? "bg-foreground text-background" : "bg-muted text-foreground/55"
                  }`}
                >
                  {t(`instructorDiscussions.filters.${filter}`, { defaultValue: filter })}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {threadsQuery.isLoading ? (
              <div className="p-4 space-y-2" aria-label={t("instructorDiscussions.state.loading", { defaultValue: "Loading discussions…" })}>
                {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="size-8 mx-auto text-foreground/25 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground/50">{t("instructorDiscussions.empty.noThreads", { defaultValue: "No threads found" })}</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedId(thread.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                    selectedId === thread.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0 size-7 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                    {initials(thread.author.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {thread.isPinned && <Pin className="size-3 text-primary shrink-0" />}
                      {thread.isResolved && <CheckCircle2 className="size-3 text-green-500 shrink-0" />}
                      <span className="font-black text-sm truncate">{thread.title}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-foreground/50 font-medium truncate">{thread.author.fullName ?? t("instructorDiscussions.labels.unknown", { defaultValue: "Unknown" })}</span>
                      <span className="text-[10px] font-bold text-foreground/40 shrink-0">{relativeTime(thread.createdAt, activeI18n.language)}</span>
                    </div>
                    {thread.repliesCount > 0 && (
                      <span className="text-[10px] font-bold text-foreground/45">
                        {t("instructorDiscussions.labels.replies", { count: thread.repliesCount, defaultValue: "{{count}} replies" })}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {!detail && !threadDetailQuery.isLoading ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10">
            <div className="space-y-2 max-w-xs">
              <MessageSquare className="size-10 mx-auto text-foreground/25" strokeWidth={1.5} />
              <p className="font-black">{t("instructorDiscussions.empty.selectTitle", { defaultValue: "Select a thread" })}</p>
              <p className="text-sm font-medium text-foreground/55">{t("instructorDiscussions.empty.selectBody", { defaultValue: "Pick a thread from the left to read and respond." })}</p>
            </div>
          </div>
        ) : threadDetailQuery.isLoading ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center" aria-label={t("instructorDiscussions.state.loadingThread", { defaultValue: "Loading thread…" })}>
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : detail ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {detail.isPinned && <Pin className="size-4 text-primary shrink-0" />}
                    {detail.isResolved && <CheckCircle2 className="size-4 text-green-500 shrink-0" />}
                    <h2 className="font-black text-base leading-tight">{detail.title}</h2>
                  </div>
                  <p className="text-xs font-medium text-foreground/50 mt-1">
                    {detail.author.fullName ?? t("instructorDiscussions.labels.unknown", { defaultValue: "Unknown" })} · {relativeTime(detail.createdAt, activeI18n.language)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(detail)}
                    title={detail.isPinned ? t("instructorDiscussions.actions.unpin", { defaultValue: "Unpin" }) : t("instructorDiscussions.actions.pin", { defaultValue: "Pin" })}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-primary"
                  >
                    {detail.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                  </button>
                  <button
                    onClick={() => toggleResolve(detail)}
                    title={detail.isResolved ? t("instructorDiscussions.actions.reopen", { defaultValue: "Reopen" }) : t("instructorDiscussions.actions.markResolved", { defaultValue: "Mark resolved" })}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-green-600"
                  >
                    <CheckCircle2 className="size-4" />
                  </button>
                  <button
                    onClick={() => deleteThread(detail.id)}
                    title={t("instructorDiscussions.actions.deleteThread", { defaultValue: "Delete thread" })}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground/75 leading-relaxed">{detail.body}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {detail.replies.length === 0 ? (
                <p className="text-center text-sm font-medium text-foreground/40 mt-6">{t("instructorDiscussions.empty.noReplies", { defaultValue: "No replies yet — be the first to respond." })}</p>
              ) : (
                detail.replies.map((item) => (
                  <div key={item.id} className={`flex gap-3 ${item.isInstructorAnswer ? "justify-end" : "justify-start"}`}>
                    {!item.isInstructorAnswer && (
                      <div className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                        {initials(item.author.fullName)}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                      item.isInstructorAnswer
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted border-2 border-border rounded-bl-sm"
                    }`}>
                      <p className={`text-[10px] font-black mb-1 ${item.isInstructorAnswer ? "text-primary-foreground/70" : "text-foreground/50"}`}>
                        {item.author.fullName ?? t("instructorDiscussions.labels.unknown", { defaultValue: "Unknown" })} {item.isInstructorAnswer && t("instructorDiscussions.labels.instructorSuffix", { defaultValue: "· Instructor" })}
                      </p>
                      {item.body}
                      <p className={`text-[10px] mt-1 ${item.isInstructorAnswer ? "text-primary-foreground/60" : "text-foreground/40"}`}>
                        {relativeTime(item.createdAt, activeI18n.language)}
                      </p>
                    </div>
                    {item.isInstructorAnswer && (
                      <div className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                        {initials(item.author.fullName)}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t-2 border-border flex items-end gap-3">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendReply(); } }}
                placeholder={t("instructorDiscussions.reply.placeholder", { defaultValue: "Reply as instructor… (Enter to send)" })}
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium resize-none focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim() || replyMutation.isPending}
                className="shrink-0 size-10 grid place-items-center rounded-2xl bg-primary text-primary-foreground chunky-shadow disabled:opacity-50"
                aria-label={t("instructorDiscussions.reply.send", { defaultValue: "Send reply" })}
              >
                {replyMutation.isPending
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Plus className="size-4" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
