import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useGroupThreads, useGroupMessages, useSendGroupMessage, type GroupMessageRecord, type GroupMessageThreadRecord } from "@/lib/lms-core-api";

export const Route = createFileRoute("/instructor/group-messages")({
  component: InstructorGroupMessagesPage,
});

function InstructorGroupMessagesPage() {
  const { t } = useTranslation();
  const threadsQuery = useGroupThreads();
  const threads = threadsQuery.data ?? [];
  const [activeThread, setActiveThread] = useState<number | null>(null);

  return (
    <DashboardShell>
      <TopBar
        title={t("groupMessages.title", "Group Messages")}
        subtitle={t("groupMessages.subtitle", "Parent–instructor threads")}
        showStreak={false}
      />

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Thread list */}
        <div className="w-72 shrink-0 rounded-3xl border-2 border-border overflow-y-auto bg-card">
          {threadsQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-foreground/50">
              {t("groupMessages.empty", "No threads yet.")}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  active={activeThread === thread.id}
                  onClick={() => setActiveThread(thread.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Message pane */}
        <div className="flex-1 min-w-0">
          {activeThread ? (
            <ChatPane threadId={activeThread} />
          ) : (
            <div className="h-full rounded-3xl border-2 border-dashed border-border flex items-center justify-center text-sm text-foreground/40">
              <div className="text-center">
                <MessageCircle className="size-10 mx-auto mb-3 opacity-30" />
                <p>{t("groupMessages.selectThread", "Select a thread to view messages")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function ThreadListItem({ thread, active, onClick }: { thread: GroupMessageThreadRecord; active: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  const lastMsg = thread.lastMessageAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(thread.lastMessageAt))
    : null;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors ${active ? "bg-primary/10" : ""}`}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="font-bold text-sm truncate">
            {t("groupMessages.group", "Group")} #{thread.groupId}
          </span>
          {lastMsg && <span className="text-[10px] text-foreground/40 shrink-0">{lastMsg}</span>}
        </div>
        <p className="text-xs text-foreground/50 mt-0.5">
          {t("groupMessages.parent", "Parent")} #{thread.parentId}
        </p>
      </button>
    </li>
  );
}

function ChatPane({ threadId }: { threadId: number }) {
  const { t } = useTranslation();
  const messagesQuery = useGroupMessages(threadId);
  const sendMessage = useSendGroupMessage(threadId);
  const messages = messagesQuery.data?.messages ?? [];
  const [draft, setDraft] = useState("");

  function handleSend() {
    if (!draft.trim()) return;
    sendMessage.mutate({ content: draft.trim(), authorRole: "instructor" });
    setDraft("");
  }

  return (
    <div className="flex flex-col h-full rounded-3xl border-2 border-border overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messagesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-foreground/40">
            {t("groupMessages.loading", "Loading…")}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-foreground/40">
            {t("groupMessages.noMessages", "No messages yet.")}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} mine={msg.authorRole === "instructor"} />
          ))
        )}
      </div>
      <div className="border-t-2 border-border bg-card p-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-2xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
          rows={2}
          placeholder={t("groupMessages.placeholder", "Write a message…")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || sendMessage.isPending}
          className="self-end bg-primary text-primary-foreground rounded-2xl px-4 py-2 font-bold text-sm disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, mine }: { msg: GroupMessageRecord; mine: boolean }) {
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
    new Date(msg.createdAt),
  );
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          mine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border-2 border-border rounded-bl-sm"
        }`}
      >
        <p>{msg.content}</p>
        <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/60" : "text-foreground/40"}`}>{time}</p>
      </div>
    </div>
  );
}
