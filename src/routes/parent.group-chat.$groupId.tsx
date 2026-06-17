import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useGroupMessageThread,
  useGroupMessages,
  useSendGroupMessage,
  type GroupMessageRecord,
} from "@/lib/lms-core-api";

export const Route = createFileRoute("/parent/group-chat/$groupId")({
  component: ParentGroupChatPage,
});

function ParentGroupChatPage() {
  const { t } = useTranslation();
  const { groupId: groupIdRaw } = Route.useParams();
  const groupId = Number(groupIdRaw);

  const startThread = useGroupMessageThread(groupId);
  const [threadId, setThreadId] = useState<number | null>(null);

  useEffect(() => {
    startThread.mutate(undefined, {
      onSuccess: (data) => setThreadId(data.id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const messagesQuery = useGroupMessages(threadId);
  const sendMessage = useSendGroupMessage(threadId ?? 0);
  const messages = messagesQuery.data?.messages ?? [];

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!draft.trim() || !threadId) return;
    sendMessage.mutate({ content: draft.trim(), authorRole: "parent" });
    setDraft("");
  }

  return (
    <DashboardShell>
      <TopBar
        title={t("groupChat.title", "Group Chat")}
        subtitle={t("groupChat.subtitle", "Message your instructor")}
        showStreak={false}
      />

      <div className="flex flex-col gap-0 h-[calc(100vh-200px)] rounded-3xl border-2 border-border overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {messagesQuery.isLoading ? (
            <div className="flex items-center justify-center h-full text-foreground/40 text-sm">
              {t("groupChat.loading", "Loading messages…")}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-foreground/40 text-sm">
              {t("groupChat.empty", "No messages yet. Say hello!")}
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} mine={msg.authorRole === "parent"} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t-2 border-border bg-card p-3 flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-2xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            rows={2}
            placeholder={t("groupChat.placeholder", "Write a message…")}
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
            disabled={!draft.trim() || sendMessage.isPending || !threadId}
            className="self-end bg-primary text-primary-foreground rounded-2xl px-4 py-2 font-bold text-sm disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardShell>
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
