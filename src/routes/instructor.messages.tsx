import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send, Loader2, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useInstructorConversations,
  useConversationMessages,
  useReplyToConversation,
  type InstructorMessage,
} from "@/lib/instructor/instructor-messages-api";

export const Route = createFileRoute("/instructor/messages")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorMessages.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Messages",
        }),
      },
    ],
  }),
  component: InstructorMessages,
});

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(iso: string | null, language: string) {
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

function BackendInstructorMessagesPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const convosQuery = useInstructorConversations();
  const messagesQuery = useConversationMessages(selectedId);
  const replyMutation = useReplyToConversation();

  const convos = convosQuery.data ?? [];
  const messages = messagesQuery.data?.messages ?? [];
  const selected = convos.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === null && convos.length > 0) {
      setSelectedId(convos[0].id);
    }
  }, [convos, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const { context } = useAppContext();
  const currentUserId = Number(context.user?.id) || -1;

  const send = async () => {
    if (!reply.trim() || selectedId === null) return;
    const text = reply.trim();
    setReply("");
    try {
      await replyMutation.mutateAsync({ chatId: selectedId, content: text });
    } catch {
      toast.error(t("instructorMessages.toast.sendFailed", { defaultValue: "Failed to send message." }));
      setReply(text);
    }
  };

  if (convosQuery.isLoading) {
    return (
      <DashboardShell>
        <TopBar
          title={t("instructorMessages.topbar.title", { defaultValue: "Messages" })}
          subtitle={t("instructorMessages.topbar.subtitle", { defaultValue: "Chat with students and parents" })}
        />
        <div className="flex items-center justify-center h-64 text-foreground/40" aria-label={t("instructorMessages.state.loading", { defaultValue: "Loading conversations…" })}>
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorMessages.topbar.title", { defaultValue: "Messages" })}
        subtitle={t("instructorMessages.topbar.subtitle", { defaultValue: "Chat with students and parents" })}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        {convos.length === 0 ? (
          <div className="xl:col-span-2 bg-card border-2 border-border rounded-3xl p-10 chunky-shadow grid place-items-center text-center">
            <div className="space-y-2 max-w-xs">
              <MessageSquare className="size-12 mx-auto text-foreground/25" strokeWidth={1.5} />
              <p className="font-black text-lg">{t("instructorMessages.empty.noMessagesTitle", { defaultValue: "No messages yet" })}</p>
              <p className="text-sm font-medium text-foreground/55">
                {t("instructorMessages.empty.noMessagesBody", { defaultValue: "Students can message you from their course player. Conversations will appear here." })}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ConvoList
              items={convos.map((c) => ({
                id: c.id,
                studentName: c.student.fullName,
                studentAvatar: c.student.avatar,
                courseTitle: c.course?.title ?? null,
                snippet: c.lastMessageSnippet,
                time: relativeTime(c.lastMessageAt, activeI18n.language),
                unread: c.unreadCount,
              }))}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setReply(""); }}
            />
            {selected ? (
              <ChatPanel
                studentName={selected.student.fullName}
                courseTitle={selected.course?.title ?? null}
                currentUserId={currentUserId}
                messages={messages}
                reply={reply}
                onReplyChange={setReply}
                onSend={send}
                sending={replyMutation.isPending}
                bottomRef={bottomRef}
              />
            ) : (
              <EmptyState />
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

type ConvoListItem = {
  id: number;
  studentName: string | null;
  studentAvatar: string | null;
  courseTitle: string | null;
  snippet: string | null;
  time: string;
  unread: number;
};

function ConvoList({
  items,
  selectedId,
  onSelect,
}: {
  items: ConvoListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
          {t("instructorMessages.labels.conversations", { count: items.length, defaultValue: "Conversations ({{count}})" })}
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {items.map((conversation) => (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                selectedId === conversation.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
              }`}
            >
              <Avatar name={conversation.studentName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm truncate">{conversation.studentName ?? t("instructorMessages.labels.student", { defaultValue: "Student" })}</span>
                  <span className="text-[10px] font-bold text-foreground/45 shrink-0">{conversation.time}</span>
                </div>
                {conversation.courseTitle && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BookOpen className="size-3 text-foreground/40 shrink-0" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-foreground/50 truncate">{conversation.courseTitle}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-foreground/55 truncate">{conversation.snippet ?? t("instructorMessages.empty.noMessagesTitle", { defaultValue: "No messages yet" })}</span>
                  {conversation.unread > 0 && (
                    <span className="shrink-0 size-5 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ChatPanel({
  studentName,
  courseTitle,
  currentUserId,
  messages,
  reply,
  onReplyChange,
  onSend,
  sending,
  bottomRef,
}: {
  studentName: string | null;
  courseTitle: string | null;
  currentUserId: number;
  messages: InstructorMessage[];
  reply: string;
  onReplyChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t, i18n: activeI18n } = useTranslation();
  const handleKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-border flex items-center gap-3">
        <Avatar name={studentName} size="lg" />
        <div>
          <p className="font-black">{studentName ?? t("instructorMessages.labels.student", { defaultValue: "Student" })}</p>
          {courseTitle && (
            <p className="text-xs font-bold text-foreground/50 flex items-center gap-1">
              <BookOpen className="size-3" strokeWidth={2.5} /> {courseTitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm font-medium text-foreground/40 mt-10">
            {t("instructorMessages.empty.noMessagesTitle", { defaultValue: "No messages yet" })}
          </p>
        ) : (
          messages.map((message) => {
            const isMe = message.role === "instructor" || message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted border-2 border-border rounded-bl-sm"
                  }`}
                >
                  {message.content}
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-foreground/40"}`}>
                    {relativeTime(message.createdAt, activeI18n.language)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t-2 border-border flex items-end gap-3">
        <textarea
          value={reply}
          onChange={(event) => onReplyChange(event.target.value)}
          onKeyDown={handleKey}
          placeholder={t("instructorMessages.reply.placeholder", { defaultValue: "Reply… (Enter to send, Shift+Enter for newline)" })}
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium resize-none focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={onSend}
          disabled={!reply.trim() || sending}
          className="shrink-0 size-10 grid place-items-center rounded-2xl bg-primary text-primary-foreground chunky-shadow disabled:opacity-50"
          aria-label={t("instructorMessages.reply.send", { defaultValue: "Send message" })}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}

function Avatar({ name, size = "md" }: { name: string | null | undefined; size?: "md" | "lg" }) {
  const sz = size === "lg" ? "size-10 text-sm" : "size-8 text-xs";
  return (
    <div className={`${sz} shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-black grid place-items-center border-2 border-foreground/10`}>
      {initials(name)}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10">
      <div className="space-y-2 max-w-xs">
        <MessageSquare className="size-10 mx-auto text-foreground/25" strokeWidth={1.5} />
        <p className="font-black">{t("instructorMessages.empty.selectTitle", { defaultValue: "Select a conversation" })}</p>
        <p className="text-sm font-medium text-foreground/55">{t("instructorMessages.empty.selectBody", { defaultValue: "Choose a thread from the left to start replying." })}</p>
      </div>
    </div>
  );
}

function InstructorMessages() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  if (context.mode !== "backend") {
    return (
      <DashboardShell>
        <TopBar
          title={t("instructorMessages.topbar.title", { defaultValue: "Messages" })}
          subtitle={t("instructorMessages.topbar.subtitle", { defaultValue: "Chat with students and parents" })}
        />
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("instructorMessages.state.prototype", { defaultValue: "Prototype mode — connect a backend to see real student conversations." })}
        </section>
      </DashboardShell>
    );
  }
  return <BackendInstructorMessagesPage />;
}
