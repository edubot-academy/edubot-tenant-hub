import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useStudentConversations,
  useStudentSendMessage,
  useConversationMessages,
  type InstructorMessage,
} from "@/lib/instructor/instructor-messages-api";

export const Route = createFileRoute("/student/messages")({
  head: () => ({ meta: [{ title: "QuestLMS — Messages" }] }),
  component: MessagesPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Prototype data ───────────────────────────────────────────────────────────

const PROTO_CONVOS = [
  {
    id: 1,
    instructor: "Prof. Aris",
    course: "Cognitive Psychology",
    snippet: "Great essay! One small note on section 3…",
    time: "2m ago",
    unread: 2,
    messages: [
      { role: "student" as const, text: "Hi! I have a question about the assignment rubric." },
      { role: "instructor" as const, text: "Of course — what's on your mind?" },
      { role: "student" as const, text: "The rubric says 'critical analysis' but I'm not sure what depth is expected." },
      { role: "instructor" as const, text: "Great essay! One small note on section 3 — try to connect the phonological loop to dual-coding theory more explicitly." },
    ],
  },
  {
    id: 2,
    instructor: "Dr. Nuray",
    course: "Calculus II",
    snippet: "The extension is approved.",
    time: "1h ago",
    unread: 0,
    messages: [
      { role: "student" as const, text: "Could I get an extension on the problem set? I've been unwell." },
      { role: "instructor" as const, text: "The extension is approved. Please submit by next Monday." },
    ],
  },
];

// ─── Prototype page ───────────────────────────────────────────────────────────

function PrototypeMessagesPage() {
  const [selectedId, setSelectedId] = useState<number>(PROTO_CONVOS[0].id);
  const [reply, setReply] = useState("");
  const [localMessages, setLocalMessages] = useState(
    Object.fromEntries(PROTO_CONVOS.map((c) => [c.id, c.messages]))
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = PROTO_CONVOS.find((c) => c.id === selectedId)!;
  const msgs = localMessages[selectedId] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const send = () => {
    if (!reply.trim()) return;
    setLocalMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), { role: "student" as const, text: reply.trim() }],
    }));
    setReply("");
  };

  const protoMessages: InstructorMessage[] = msgs.map((m, i) => ({
    id: i,
    chatId: selectedId,
    senderId: m.role === "student" ? -1 : -2,
    role: m.role,
    content: m.text,
    createdAt: new Date().toISOString(),
  }));

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Chat with your instructors" />
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        <ConvoList
          items={PROTO_CONVOS.map((c) => ({
            id: c.id,
            name: c.instructor,
            avatar: null,
            courseTitle: c.course,
            snippet: c.snippet,
            time: c.time,
            unread: c.unread,
          }))}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setReply(""); }}
        />
        <ChatPanel
          name={selected.instructor}
          courseTitle={selected.course}
          myRole="student"
          messages={protoMessages}
          reply={reply}
          onReplyChange={setReply}
          onSend={send}
          sending={false}
          bottomRef={bottomRef}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendMessagesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const convosQuery = useStudentConversations();
  const messagesQuery = useConversationMessages(selectedId);
  const sendMutation = useStudentSendMessage();

  const convos = convosQuery.data ?? [];
  const messages = messagesQuery.data?.messages ?? [];
  const selected = convos.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === null && convos.length > 0) setSelectedId(convos[0].id);
  }, [convos, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!reply.trim() || !selected) return;
    const text = reply.trim();
    setReply("");
    try {
      await sendMutation.mutateAsync({ content: text, courseId: selected.course?.id });
    } catch {
      toast.error("Failed to send message.");
      setReply(text);
    }
  };

  if (convosQuery.isLoading) {
    return (
      <DashboardShell>
        <TopBar title="Messages" subtitle="Chat with your instructors" />
        <div className="flex items-center justify-center h-64 text-foreground/40">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Chat with your instructors" />
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5 h-[calc(100vh-200px)] min-h-[500px]">
        {convos.length === 0 ? (
          <div className="xl:col-span-2 bg-card border-2 border-border rounded-3xl p-10 chunky-shadow grid place-items-center text-center">
            <div className="space-y-2 max-w-xs">
              <MessageSquare className="size-12 mx-auto text-foreground/25" strokeWidth={1.5} />
              <p className="font-black text-lg">No conversations yet</p>
              <p className="text-sm font-medium text-foreground/55">
                Message your instructor from within a course to start a thread.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ConvoList
              items={convos.map((c) => ({
                id: c.id,
                name: c.instructor.fullName,
                avatar: c.instructor.avatar,
                courseTitle: c.course?.title ?? null,
                snippet: c.lastMessageSnippet,
                time: relativeTime(c.lastMessageAt),
                unread: c.unreadCount,
              }))}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setReply(""); }}
            />
            {selected ? (
              <ChatPanel
                name={selected.instructor.fullName}
                courseTitle={selected.course?.title ?? null}
                myRole="student"
                messages={messages}
                reply={reply}
                onReplyChange={setReply}
                onSend={send}
                sending={sendMutation.isPending}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

type ConvoListItem = {
  id: number;
  name: string | null;
  avatar: string | null;
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
  return (
    <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
          Conversations ({items.length})
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {items.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                selectedId === c.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
              }`}
            >
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm truncate">{c.name ?? "Instructor"}</span>
                  <span className="text-[10px] font-bold text-foreground/45 shrink-0">{c.time}</span>
                </div>
                {c.courseTitle && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BookOpen className="size-3 text-foreground/40 shrink-0" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-foreground/50 truncate">{c.courseTitle}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-foreground/55 truncate">{c.snippet ?? "No messages yet"}</span>
                  {c.unread > 0 && (
                    <span className="shrink-0 size-5 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                      {c.unread}
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
  name,
  courseTitle,
  myRole,
  messages,
  reply,
  onReplyChange,
  onSend,
  sending,
  bottomRef,
}: {
  name: string | null;
  courseTitle: string | null;
  myRole: "student" | "instructor";
  messages: InstructorMessage[];
  reply: string;
  onReplyChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-border flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div>
          <p className="font-black">{name ?? "Instructor"}</p>
          {courseTitle && (
            <p className="text-xs font-bold text-foreground/50 flex items-center gap-1">
              <BookOpen className="size-3" strokeWidth={2.5} /> {courseTitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm font-medium text-foreground/40 mt-10">No messages yet</p>
        ) : (
          messages.map((m) => {
            const isMe = m.role === myRole;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted border-2 border-border rounded-bl-sm"
                  }`}
                >
                  {m.content}
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-foreground/40"}`}>
                    {relativeTime(m.createdAt)}
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
          onChange={(e) => onReplyChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium resize-none focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={onSend}
          disabled={!reply.trim() || sending}
          className="shrink-0 size-10 grid place-items-center rounded-2xl bg-primary text-primary-foreground chunky-shadow disabled:opacity-50"
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
  return (
    <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10">
      <div className="space-y-2 max-w-xs">
        <MessageSquare className="size-10 mx-auto text-foreground/25" strokeWidth={1.5} />
        <p className="font-black">Select a conversation</p>
        <p className="text-sm font-medium text-foreground/55">Choose a thread from the left to read and reply.</p>
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function MessagesPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendMessagesPage /> : <PrototypeMessagesPage />;
}
