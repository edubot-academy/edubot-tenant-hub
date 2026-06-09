import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Loader2, MessageSquare, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useDiscussionThreads,
  useDiscussionThread,
  useCreateReply,
  usePatchThread,
  useDeleteThread,
  type DiscussionThread,
} from "@/lib/discussions-api";

export const Route = createFileRoute("/instructor/discussions")({
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
        <TopBar title="Discussions" subtitle="Answer questions and moderate class forums" />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode — connect a backend to see real discussion threads.
        </section>
      </DashboardShell>
    );
  }
  return <BackendDiscussionsPage />;
}

// ─── Backend page ─────────────────────────────────────────────────────────────

type StatusFilter = "all" | "open" | "pinned" | "resolved";

function BackendDiscussionsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const threadsQuery = useDiscussionThreads({ q: debouncedQ || undefined, status: status === "all" ? undefined : status });
  const threadDetailQuery = useDiscussionThread(selectedId);
  const replyMutation = useCreateReply(selectedId);
  const patchMutation = usePatchThread();
  const deleteMutation = useDeleteThread();

  const threads = threadsQuery.data ?? [];
  const detail = threadDetailQuery.data ?? null;

  useEffect(() => {
    if (selectedId === null && threads.length > 0) setSelectedId(threads[0].id);
  }, [threads.length]);

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
      toast.error("Failed to post reply.");
      setReply(text);
    }
  };

  const togglePin = async (thread: DiscussionThread) => {
    try {
      await patchMutation.mutateAsync({ id: thread.id, isPinned: !thread.isPinned });
    } catch {
      toast.error("Failed to update thread.");
    }
  };

  const toggleResolve = async (thread: DiscussionThread) => {
    try {
      await patchMutation.mutateAsync({ id: thread.id, isResolved: !thread.isResolved });
    } catch {
      toast.error("Failed to update thread.");
    }
  };

  const deleteThread = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("Thread deleted.");
    } catch {
      toast.error("Failed to delete thread.");
    }
  };

  return (
    <DashboardShell>
      <TopBar title="Discussions" subtitle="Answer questions and moderate class forums" />

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Thread list */}
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b-2 border-border space-y-2">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
              <Search className="size-4 text-foreground/50 shrink-0" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => setDebouncedQ(e.target.value), 400);
                }}
                placeholder="Search threads…"
                className="bg-transparent outline-none py-2 text-sm font-medium w-full"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "open", "pinned", "resolved"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg py-1 text-[10px] font-black uppercase tracking-wider ${
                    status === s ? "bg-foreground text-background" : "bg-muted text-foreground/55"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {threadsQuery.isLoading ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="size-8 mx-auto text-foreground/25 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground/50">No threads found</p>
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
                  <div className="mt-0.5 shrink-0 size-7 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                    {initials(t.author.fullName)}
                  </div>
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
                      <span className="text-[10px] font-bold text-foreground/45">{t.repliesCount} {t.repliesCount === 1 ? "reply" : "replies"}</span>
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
              <p className="text-sm font-medium text-foreground/55">Pick a thread from the left to read and respond.</p>
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {detail.isPinned && <Pin className="size-4 text-primary shrink-0" />}
                    {detail.isResolved && <CheckCircle2 className="size-4 text-green-500 shrink-0" />}
                    <h2 className="font-black text-base leading-tight">{detail.title}</h2>
                  </div>
                  <p className="text-xs font-medium text-foreground/50 mt-1">
                    {detail.author.fullName ?? "Unknown"} · {relativeTime(detail.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(detail)}
                    title={detail.isPinned ? "Unpin" : "Pin"}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-primary"
                  >
                    {detail.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                  </button>
                  <button
                    onClick={() => toggleResolve(detail)}
                    title={detail.isResolved ? "Reopen" : "Mark resolved"}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-green-600"
                  >
                    <CheckCircle2 className="size-4" />
                  </button>
                  <button
                    onClick={() => deleteThread(detail.id)}
                    title="Delete thread"
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground/75 leading-relaxed">{detail.body}</p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {detail.replies.length === 0 ? (
                <p className="text-center text-sm font-medium text-foreground/40 mt-6">No replies yet — be the first to respond.</p>
              ) : (
                detail.replies.map((r) => (
                  <div key={r.id} className={`flex gap-3 ${r.isInstructorAnswer ? "justify-end" : "justify-start"}`}>
                    {!r.isInstructorAnswer && (
                      <div className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                        {initials(r.author.fullName)}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                      r.isInstructorAnswer
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted border-2 border-border rounded-bl-sm"
                    }`}>
                      <p className={`text-[10px] font-black mb-1 ${r.isInstructorAnswer ? "text-primary-foreground/70" : "text-foreground/50"}`}>
                        {r.author.fullName ?? "Unknown"} {r.isInstructorAnswer && "· Instructor"}
                      </p>
                      {r.body}
                      <p className={`text-[10px] mt-1 ${r.isInstructorAnswer ? "text-primary-foreground/60" : "text-foreground/40"}`}>
                        {relativeTime(r.createdAt)}
                      </p>
                    </div>
                    {r.isInstructorAnswer && (
                      <div className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-primary-foreground text-[10px] font-black border border-foreground/10">
                        {initials(r.author.fullName)}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="px-4 py-3 border-t-2 border-border flex items-end gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Reply as instructor… (Enter to send)"
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
                  : <Plus className="size-4" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
