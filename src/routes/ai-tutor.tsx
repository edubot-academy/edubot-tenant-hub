import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, BookOpen, Loader2, Plus, RotateCcw, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useAiChats,
  useAiMessages,
  useCreateAiChat,
  useSendAiMessage,
  type AiMessage,
} from "@/lib/ai-tutor-api";
import { useStudentPortalCourses } from "@/lib/student-portal-api";

export const Route = createFileRoute("/ai-tutor")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Tutor" }] }),
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    lessonId: z.coerce.number().optional(),
  }),
  component: AiTutorPage,
});

function AiTutorPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") return <PrototypeAiTutorPage />;
  return <BackendAiTutorPage />;
}

// ─── Backend implementation ───────────────────────────────────────────────────

function BackendAiTutorPage() {
  const { courseId: paramCourseId, lessonId: paramLessonId } = Route.useSearch();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(paramCourseId ?? null);
  // lessonId to pass on first chat creation for this session; cleared after first send
  const [pendingLessonId, setPendingLessonId] = useState<number | undefined>(paramLessonId);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const coursesQuery = useStudentPortalCourses();
  const chatsQuery = useAiChats(selectedCourseId);
  const messagesQuery = useAiMessages(activeChatId);
  const createChat = useCreateAiChat();
  const sendMessage = useSendAiMessage();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // When coming from course player with a courseId param, auto-select that course once loaded
  useEffect(() => {
    if (!paramCourseId || !coursesQuery.data) return;
    const match = coursesQuery.data.find((c) => c.courseId === paramCourseId);
    if (match) setSelectedCourseId(paramCourseId);
  }, [paramCourseId, coursesQuery.data]);

  // Pick most recent active chat when course's chat list loads; if coming from lesson, start fresh
  useEffect(() => {
    if (!chatsQuery.data) return;
    if (pendingLessonId) {
      // Starting a lesson-context chat — don't resume an old chat
      setActiveChatId(null);
      setMessages([]);
      return;
    }
    const sorted = [...chatsQuery.data].sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? b.createdAt).getTime() -
        new Date(a.lastMessageAt ?? a.createdAt).getTime(),
    );
    if (sorted.length > 0) {
      setActiveChatId(sorted[0].id);
    } else {
      setActiveChatId(null);
      setMessages([]);
    }
  }, [chatsQuery.data, pendingLessonId]);

  // Populate thread from loaded history
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.filter((m) => m.role !== "system"));
    }
  }, [messagesQuery.data]);

  const selectCourse = (id: number) => {
    if (id === selectedCourseId) return;
    setSelectedCourseId(id);
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    setLessonTitle(null);
    setPendingLessonId(undefined);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    setLessonTitle(null);
    setPendingLessonId(undefined);
    inputRef.current?.focus();
  };

  const send = async (text: string) => {
    if (!text.trim() || sending || !selectedCourseId) return;
    setInput("");
    setSuggestions([]);
    setSending(true);

    const tempId = Date.now();
    const tempUserMsg: AiMessage = {
      id: tempId,
      chatId: activeChatId ?? 0,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let chatId = activeChatId;
      if (!chatId) {
        const newChat = await createChat.mutateAsync({
          courseId: selectedCourseId,
          lessonId: pendingLessonId,
        });
        chatId = newChat.id;
        setActiveChatId(chatId);
        if (newChat.lessonTitle) setLessonTitle(newChat.lessonTitle);
        setPendingLessonId(undefined);
      }

      const result = await sendMessage.mutateAsync({ chatId, content: text });
      setMessages((prev) => [...prev, result.message]);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
    } catch {
      toast.error("Failed to get a response. The AI tutor may not be enabled for this course.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const courses = coursesQuery.data ?? [];
  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId);

  return (
    <DashboardShell>
      <TopBar
        title="AI Tutor"
        subtitle={
          selectedCourse
            ? `Chatting about: ${selectedCourse.title}`
            : "Select a course to start"
        }
        showStreak={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">
        {/* ── Chat panel ── */}
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b-2 border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                <Bot className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black">Quest Tutor</p>
                <p className="text-[11px] font-bold text-foreground/55 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {lessonTitle
                    ? `Lesson: ${lessonTitle}`
                    : selectedCourse
                      ? selectedCourse.title
                      : "Pick a course →"}
                </p>
              </div>
            </div>
            {activeChatId && (
              <button
                onClick={startNewChat}
                className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted"
              >
                <Plus className="size-3.5" /> New chat
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!selectedCourseId ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
                <div className="size-16 rounded-3xl bg-primary/10 grid place-items-center border-2 border-primary/20">
                  <BookOpen className="size-8 text-primary/50" strokeWidth={1.5} />
                </div>
                <p className="font-black text-lg">Pick a course</p>
                <p className="text-sm font-medium text-foreground/55 max-w-xs">
                  Choose one of your enrolled courses from the sidebar and I'll tutor you on it.
                </p>
              </div>
            ) : messagesQuery.isLoading ? (
              <div className="space-y-4 pt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                    <div className="size-8 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div
                      className="h-12 rounded-2xl bg-muted animate-pulse"
                      style={{ width: `${40 + i * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
                <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow">
                  <Bot className="size-8" strokeWidth={1.5} />
                </div>
                <p className="font-black text-lg">
                  Hi! Ask me anything about{" "}
                  <span className="text-primary">{selectedCourse?.title}</span>.
                </p>
                <p className="text-sm font-medium text-foreground/55 max-w-xs">
                  I'll guide you step by step — not just hand over the answer.
                </p>
              </div>
            ) : (
              messages.map((m) => <Bubble key={m.id} msg={m} />)
            )}

            {sending && (
              <div className="flex items-end gap-2">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                  <Bot className="size-4" strokeWidth={2.5} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted border-2 border-border flex gap-1">
                  <Dot /><Dot delay={150} /><Dot delay={300} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-border bg-background shrink-0">
            {suggestions.length > 0 && !sending && (
              <div className="px-3 pt-2 pb-1 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="p-3 flex gap-2"
            >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedCourseId ? "Ask the tutor anything…" : "Select a course first"}
              disabled={!selectedCourseId || sending}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || !selectedCourseId}
              className="size-12 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow disabled:opacity-50"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.5} />}
            </button>
            </form>
          </div>
        </section>

        {/* ── Course picker sidebar ── */}
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow flex flex-col gap-3 overflow-y-auto">
          <h3 className="font-black flex items-center gap-2 shrink-0">
            <Sparkles className="size-4 text-primary" /> Your courses
          </h3>

          {coursesQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-xs font-medium text-foreground/50">No enrolled courses found.</p>
          ) : (
            <ul className="space-y-2">
              {courses.map((c) => {
                const active = c.courseId === selectedCourseId;
                return (
                  <li key={c.courseId}>
                    <button
                      onClick={() => selectCourse(c.courseId)}
                      className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                        active
                          ? "border-primary bg-primary/10 chunky-shadow -translate-y-0.5"
                          : "border-border hover:bg-muted hover:-translate-y-0.5"
                      }`}
                    >
                      <p className={`text-sm font-black truncate ${active ? "text-primary" : ""}`}>
                        {c.title}
                      </p>
                      {c.instructor?.name && (
                        <p className="text-[10px] font-medium text-foreground/50 mt-0.5 truncate">
                          {c.instructor.name}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {activeChatId && (
            <div className="mt-auto shrink-0 pt-3 border-t-2 border-border">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-2">
                Current session
              </p>
              <p className="text-xs font-medium text-foreground/60">
                {messages.length} message{messages.length !== 1 ? "s" : ""} in this chat.
              </p>
              <button
                onClick={startNewChat}
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-muted px-3 py-2 text-xs font-bold hover:bg-foreground/10 transition-colors"
              >
                <RotateCcw className="size-3.5" /> Start new chat
              </button>
            </div>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

function Bubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`size-8 rounded-xl grid place-items-center shrink-0 ${
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
      </div>
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow whitespace-pre-wrap"
            : "bg-muted border-border rounded-bl-md"
        }`}
      >
        {isUser ? msg.content : <MarkdownContent content={msg.content} />}
      </div>
    </div>
  );
}

function MdInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} className="rounded bg-background/50 px-1 font-mono text-xs">{p.slice(1, -1)}</code>;
        return p;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]))
        items.push(lines[i++].replace(/^\d+\.\s/, ""));
      nodes.push(
        <ol key={i} className="list-decimal list-inside space-y-0.5 my-1">
          {items.map((t, j) => <li key={j}><MdInline text={t} /></li>)}
        </ol>,
      );
    } else if (/^[-•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i]))
        items.push(lines[i++].replace(/^[-•]\s/, ""));
      nodes.push(
        <ul key={i} className="list-disc list-inside space-y-0.5 my-1">
          {items.map((t, j) => <li key={j}><MdInline text={t} /></li>)}
        </ul>,
      );
    } else {
      nodes.push(<p key={i}><MdInline text={line} /></p>);
      i++;
    }
  }
  return <div className="space-y-1.5">{nodes}</div>;
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="size-2 rounded-full bg-foreground/40 animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

// ─── Prototype fallback ───────────────────────────────────────────────────────

type PrototypeMsg = { id: string; role: "user" | "tutor"; text: string };

const SUGGESTIONS = [
  "Explain working memory like I'm 12",
  "Quiz me on the phonological loop",
  "Help me solve: 3x + 7 = 22",
  "Summarize the French Revolution in 5 bullets",
];

const INITIAL: PrototypeMsg[] = [
  { id: "0", role: "tutor", text: "Hi! I'm your AI tutor. Ask me about any lesson, or paste a problem you're stuck on. I'll guide you step by step — not just hand over the answer." },
];

function PrototypeAiTutorPage() {
  const [messages, setMessages] = useState<PrototypeMsg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "tutor", text: tutorReply(text) }]);
      setTyping(false);
      inputRef.current?.focus();
    }, 800 + Math.random() * 500);
  };

  return (
    <DashboardShell>
      <TopBar title="AI Tutor" subtitle="Conversational homework help — friendly, Socratic, on your level." showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b-2 border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                <Bot className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black">Quest Tutor</p>
                <p className="text-[11px] font-bold text-foreground/55 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" /> Online · demo mode
                </p>
              </div>
            </div>
            <button
              onClick={() => setMessages(INITIAL)}
              className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                  {m.role === "user" ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
                </div>
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow" : "bg-muted border-border rounded-bl-md"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-end gap-2">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                  <Bot className="size-4" strokeWidth={2.5} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted border-2 border-border flex gap-1">
                  <Dot /><Dot delay={150} /><Dot delay={300} />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t-2 border-border p-3 flex gap-2 bg-background"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the tutor anything…"
              className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="size-12 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow disabled:opacity-50"
            >
              {typing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.5} />}
            </button>
          </form>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" /> Try asking
          </h3>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left text-xs font-bold p-3 rounded-2xl bg-muted hover:bg-foreground/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-2xl bg-accent/15 border-2 border-accent/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-1">Tip</p>
            <p className="text-xs font-medium">Paste a quiz question or a paragraph from your textbook — the tutor will adapt.</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function tutorReply(q: string): string {
  const t = q.toLowerCase();
  if (/quiz me/.test(t))
    return "Great — quick question:\n\nWhich component of working memory rehearses verbal information?\n  A) Visuospatial sketchpad\n  B) Phonological loop\n  C) Central executive\n  D) Episodic buffer\n\nType A, B, C, or D and I'll explain!";
  if (/3x ?\+ ?7/.test(t))
    return "Let's walk through it together:\n\n1. Start with 3x + 7 = 22.\n2. Subtract 7 from both sides → 3x = 15.\n3. Divide both sides by 3 → x = 5.\n\nWant to try one yourself? Try: 4y − 6 = 14.";
  if (/working memory|like i'?m 12/.test(t))
    return "Think of working memory as a tiny mental whiteboard 🧠 — you can scribble about 4 things on it at once. If you don't keep going over them, they fade. That's why repeating a phone number out loud helps you remember it long enough to dial.";
  if (/french revolution/.test(t))
    return "Sure! Here's a fast 5-bullet summary:\n• 1789: Estates-General → Tennis Court Oath; revolution begins.\n• Bastille stormed (Jul 14) — symbol of popular uprising.\n• Declaration of the Rights of Man and of the Citizen.\n• Reign of Terror (1793–94) under Robespierre.\n• Ends with Napoleon's coup in 1799.";
  return "Good question. Let's break it down step by step — what do you already know about it? Even a rough idea helps me meet you where you are.";
}
