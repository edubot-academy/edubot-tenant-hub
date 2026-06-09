import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MessageSquare, Pin, Plus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useDiscussionThreads,
  useDiscussionThread,
  useCreateThread,
  useCreateReply,
  type DiscussionThread,
} from "@/lib/discussions-api";

export const Route = createFileRoute("/student/discussions")({
  head: () => ({ meta: [{ title: "QuestLMS — Discussions" }] }),
  component: DiscussionsPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(iso: string | null | undefined) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Entry point ─────────────────────────────────────────────────────────────

function DiscussionsPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar title="Discussions" subtitle="Ask questions and discuss with classmates" />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode — connect a backend to see real discussion threads.
        </section>
      </DashboardShell>
    );
  }
  return <BackendDiscussionsPage />;
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendDiscussionsPage() {
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
  }, [threads.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.replies.length]);

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      const thread = await createMutation.mutateAsync({ title: newTitle.trim(), body: newBody.trim() });
      setNewTitle("");
      setNewBody("");
      setShowNewForm(false);
      setSelectedId(thread.id);
      toast.success("Thread posted.");
    } catch {
      toast.error("Failed to post thread.");
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || selectedId === null) return;
    const text = reply.trim();
    setReply("");
    try {
      await replyMutation.mutateAsync(text);
    } catch {
      toast.error("Failed to post reply.");
      setReply(text);
    }
  };

  return (
    <DashboardShell>
      <TopBar title="Discussions" subtitle="Ask questions and discuss with classmates" />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Thread list */}
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b-2 border-border flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
              Threads ({threads.length})
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary"
            >
              <Plus className="size-3" /> New
            </button>
          </div>

          {showNewForm && (
            <form onSubmit={submitNew} className="p-3 border-b-2 border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">New thread</p>
                <button type="button" onClick={() => setShowNewForm(false)} className="text-foreground/40 hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title…"
                required
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Describe your question or topic…"
                rows={3}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary resize-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newTitle.trim() || !newBody.trim()}
                className="w-full rounded-xl bg-primary py-2 text-sm font-black text-primary-foreground disabled:opacity-50"
              >
                {createMutation.isPending ? "Posting…" : "Post thread"}
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
                <p className="text-sm font-medium text-foreground/50">No threads yet</p>
                <p className="text-xs font-medium text-foreground/40 mt-1">Be the first to start a discussion.</p>
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                    selectedId === t.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {t.isPinned && <Pin className="size-3 text-primary shrink-0" />}
                      {t.isResolved && <CheckCircle2 className="size-3 text-green-500 shrink-0" />}
                      <span className="font-black text-sm truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-foreground/50 font-medium truncate">{t.author.fullName ?? "Unknown"}</span>
                      <span className="text-[10px] font-bold text-foreground/40 shrink-0">{relativeTime(t.createdAt)}</span>
                    </div>
                    {t.repliesCount > 0 && (
                      <span className="text-[10px] font-bold text-foreground/40">{t.repliesCount} {t.repliesCount === 1 ? "reply" : "replies"}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread detail */}
        {!detail && !threadDetailQuery.isLoading ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10">
            <div className="space-y-2 max-w-xs">
              <MessageSquare className="size-10 mx-auto text-foreground/25" strokeWidth={1.5} />
              <p className="font-black">Select a thread</p>
              <p className="text-sm font-medium text-foreground/55">Pick a thread to read and join the discussion.</p>
            </div>
          </div>
        ) : threadDetailQuery.isLoading ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : detail ? (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b-2 border-border">
              <div className="flex items-start gap-2">
                {detail.isPinned && <Pin className="size-4 text-primary shrink-0 mt-0.5" />}
                {detail.isResolved && <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />}
                <div>
                  <h2 className="font-black text-base leading-tight">{detail.title}</h2>
                  <p className="text-xs font-medium text-foreground/50 mt-1">
                    {detail.author.fullName ?? "Unknown"} · {relativeTime(detail.createdAt)}
                    {detail.isResolved && " · Resolved"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground/75 leading-relaxed">{detail.body}</p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {detail.replies.length === 0 ? (
                <p className="text-center text-sm font-medium text-foreground/40 mt-6">No replies yet.</p>
              ) : (
                detail.replies.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <div className={`size-7 shrink-0 rounded-lg grid place-items-center text-[10px] font-black border ${
                      r.isInstructorAnswer
                        ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-foreground/10"
                        : "bg-muted text-foreground/70 border-border"
                    }`}>
                      {initials(r.author.fullName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-foreground/60 mb-1">
                        {r.author.fullName ?? "Unknown"}
                        {r.isInstructorAnswer && (
                          <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">Instructor</span>
                        )}
                        <span className="ml-2 font-bold text-foreground/40">{relativeTime(r.createdAt)}</span>
                      </p>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                        r.isInstructorAnswer
                          ? "bg-primary/10 border-2 border-primary/20 text-foreground"
                          : "bg-muted border-2 border-border"
                      }`}>
                        {r.body}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            {!detail.isResolved && (
              <div className="px-4 py-3 border-t-2 border-border flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Add a reply… (Enter to send)"
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
                <CheckCircle2 className="size-3.5 inline mr-1" /> This thread is marked as resolved
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
