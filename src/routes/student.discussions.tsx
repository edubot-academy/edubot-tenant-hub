import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MessageSquare, Pin, Plus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useDiscussionThreads,
  useDiscussionThread,
  useCreateThread,
  useCreateReply,
} from "@/lib/discussions-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/discussions")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.discussions.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: DiscussionsPage,
});

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(iso: string | null | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("studentPages.common.justNow");
  if (mins < 60) return t("studentPages.common.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("studentPages.common.hoursAgo", { count: hrs });
  return t("studentPages.common.daysAgo", { count: Math.floor(hrs / 24) });
}

function DiscussionsPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title={t("studentPages.discussions.title")} subtitle={t("studentPages.discussions.subtitle")} />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("studentPages.discussions.prototypeNotice")}
        </section>
      </DashboardShell>
    );
  }
  return <BackendDiscussionsPage />;
}

function BackendDiscussionsPage() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const threadsQuery = useDiscussionThreads();
  const threadDetailQuery = useDiscussionThread(selectedId);
  const createMutation = useCreateThread();
  const replyMutation = useCreateReply(selectedId);

  const threads = threadsQuery.data ?? [];
  const detail = threadDetailQuery.data ?? null;

  useEffect(() => {
    if (selectedId === null && threads.length > 0) setSelectedId(threads[0].id);
  }, [threads.length, selectedId, threads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.replies?.length]);

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      const thread = await createMutation.mutateAsync({ title: newTitle.trim(), body: newBody.trim() });
      setNewTitle("");
      setNewBody("");
      setShowNewForm(false);
      setSelectedId(thread.id);
      toast.success(t("studentPages.discussions.posted"));
    } catch {
      toast.error(t("studentPages.discussions.postFailed"));
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || selectedId === null) return;
    const text = reply.trim();
    setReply("");
    try {
      await replyMutation.mutateAsync(text);
    } catch {
      toast.error(t("studentPages.discussions.replyFailed"));
      setReply(text);
    }
  };

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.discussions.title")} subtitle={t("studentPages.discussions.subtitle")} />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b-2 border-border flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              {t("studentPages.discussions.threads", { count: threads.length })}
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary"
            >
              <Plus className="size-3" /> {t("studentPages.discussions.new")}
            </button>
          </div>

          {showNewForm && (
            <form onSubmit={submitNew} className="p-3 border-b-2 border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("studentPages.discussions.newThread")}</p>
                <button type="button" onClick={() => setShowNewForm(false)} className="text-foreground/40 hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("studentPages.discussions.titlePlaceholder")}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder={t("studentPages.discussions.bodyPlaceholder")}
                rows={3}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary resize-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newTitle.trim() || !newBody.trim()}
                className="w-full rounded-xl bg-primary py-2 text-sm font-black text-primary-foreground disabled:opacity-50"
              >
                {createMutation.isPending ? t("studentPages.discussions.posting") : t("studentPages.discussions.postThread")}
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {threadsQuery.isLoading ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="size-8 mx-auto text-foreground/25 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground/50">{t("studentPages.discussions.noThreadsTitle")}</p>
                <p className="text-xs font-medium text-foreground/40 mt-1">{t("studentPages.discussions.noThreadsBody")}</p>
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {thread.isPinned && <Pin className="size-3 text-primary shrink-0" />}
                      {thread.isResolved && <CheckCircle2 className="size-3 text-green-500 shrink-0" />}
                      <span className="font-black text-sm truncate">{thread.title}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-foreground/50 font-medium truncate">{thread.author?.fullName ?? t("studentPages.discussions.unknown")}</span>
                      <span className="text-[10px] font-bold text-foreground/40 shrink-0">{relativeTime(thread.createdAt, t)}</span>
                    </div>
                    {thread.repliesCount > 0 && (
                      <span className="text-[10px] font-bold text-foreground/40">
                        {thread.repliesCount} {thread.repliesCount === 1 ? t("studentPages.discussions.reply") : t("studentPages.discussions.replies")}
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
              <p className="font-black">{t("studentPages.discussions.selectTitle")}</p>
              <p className="text-sm font-medium text-foreground/55">{t("studentPages.discussions.selectBody")}</p>
            </div>
          </div>
        ) : threadDetailQuery.isLoading ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : detail ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-border">
              <div className="flex items-start gap-2">
                {detail.isPinned && <Pin className="size-4 text-primary shrink-0 mt-0.5" />}
                {detail.isResolved && <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />}
                <div>
                  <h2 className="font-black text-base leading-tight">{detail.title}</h2>
                  <p className="text-xs font-medium text-foreground/50 mt-1">
                    {detail.author?.fullName ?? t("studentPages.discussions.unknown")} · {relativeTime(detail.createdAt, t)}
                    {detail.isResolved && ` · ${t("studentPages.discussions.resolved")}`}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground/75 leading-relaxed">{detail.body}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {(detail.replies?.length ?? 0) === 0 ? (
                <p className="text-center text-sm font-medium text-foreground/40 mt-6">{t("studentPages.discussions.noReplies")}</p>
              ) : (
                (detail.replies ?? []).map((replyItem) => (
                  <div key={replyItem.id} className="flex gap-3">
                    <div className={`size-7 shrink-0 rounded-lg grid place-items-center text-[10px] font-black border ${
                      replyItem.isInstructorAnswer
                        ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-foreground/10"
                        : "bg-muted text-foreground/70 border-border"
                    }`}>
                      {initials(replyItem.author?.fullName ?? "")}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-foreground/60 mb-1">
                        {replyItem.author?.fullName ?? t("studentPages.discussions.unknown")}
                        {replyItem.isInstructorAnswer && (
                          <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">{t("studentPages.discussions.instructor")}</span>
                        )}
                        <span className="ml-2 font-bold text-foreground/40">{relativeTime(replyItem.createdAt, t)}</span>
                      </p>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                        replyItem.isInstructorAnswer
                          ? "bg-primary/10 border-2 border-primary/20 text-foreground"
                          : "bg-muted border-2 border-border"
                      }`}>
                        {replyItem.body}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {!detail.isResolved && (
              <div className="px-4 py-3 border-t-2 border-border flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder={t("studentPages.discussions.replyPlaceholder")}
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium resize-none focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || replyMutation.isPending}
                  className="shrink-0 size-10 grid place-items-center rounded-2xl bg-primary text-primary-foreground chunky-shadow disabled:opacity-50"
                >
                  {replyMutation.isPending
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Send className="size-4" strokeWidth={2.5} />}
                </button>
              </div>
            )}
            {detail.isResolved && (
              <div className="px-4 py-3 border-t-2 border-border text-center text-xs font-bold text-green-600">
                <CheckCircle2 className="size-3.5 inline mr-1" /> {t("studentPages.discussions.resolvedNotice")}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
