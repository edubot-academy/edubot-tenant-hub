import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, BookOpen, CalendarClock, CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2, MapPin, MessageSquare, Plus, RotateCcw, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useAiChats,
  useAiMessages,
  useCreateAiChat,
  useSendAiMessage,
  type AiChat,
  type AiMessage,
} from "@/lib/ai-tutor-api";
import {
  useStudentPortalCourses,
  useStudentPortalCourseDetail,
  type StudentPortalCourse,
} from "@/lib/student-portal-api";

export const Route = createFileRoute("/ai-tutor")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Tutor" }] }),
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    lessonId: z.coerce.number().optional(),
  }),
  component: AiTutorPage,
});

const LESSON_CHIPS = [
  "Explain this lesson step by step",
  "Quiz me on the key concepts",
  "I'm stuck on something — help me",
  "Give me a summary to remember",
];

const COURSE_CHIPS = [
  "Catch me up on what we've covered",
  "Quiz me on recent topics",
  "I'm stuck on something — help me",
  "Help me with an exercise",
];

const SESSION_CHIPS = [
  "Help me prepare for this session",
  "Summarize what we covered last time",
  "I didn't understand something from class",
  "Quiz me on what we've done so far",
];

function AiTutorPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") return <PrototypeAiTutorPage />;
  return <BackendAiTutorPage />;
}

// ─── Backend implementation ───────────────────────────────────────────────────

function BackendAiTutorPage() {
  const { courseId: paramCourseId, lessonId: paramLessonId } = Route.useSearch();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(paramCourseId ?? null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(paramLessonId ?? null);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
  const [pendingLessonId, setPendingLessonId] = useState<number | undefined>(paramLessonId);
  const [pendingChatTitle, setPendingChatTitle] = useState<string | undefined>(undefined);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const coursesQuery = useStudentPortalCourses();
  const courses = (coursesQuery.data ?? []).filter((c) => c.aiAssistantEnabled);
  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId) ?? null;

  const courseDetailQuery = useStudentPortalCourseDetail(
    selectedCourseId,
    selectedCourse?.groupId ?? null,
  );
  const sections = courseDetailQuery.data?.sections ?? [];
  const sessions = courseDetailQuery.data?.sessions ?? [];
  const isVideoType = selectedCourse?.courseType === "video";

  // Only call AI endpoints when the selected course actually has AI enabled
  const aiEnabledCourseId = selectedCourse?.aiAssistantEnabled ? selectedCourseId : null;
  const chatsQuery = useAiChats(aiEnabledCourseId);
  const messagesQuery = useAiMessages(activeChatId);
  const createChat = useCreateAiChat();
  const sendMessage = useSendAiMessage();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Auto-select course from URL param — only if AI is enabled for that course
  useEffect(() => {
    if (!paramCourseId || !coursesQuery.data) return;
    if (courses.find((c) => c.courseId === paramCourseId)) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId, courses, coursesQuery.data]);

  // Resume most-recent chat when course is picked (unless context is pending)
  useEffect(() => {
    if (!chatsQuery.data) return;
    if (pendingLessonId || pendingChatTitle) {
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
  }, [chatsQuery.data, pendingLessonId, pendingChatTitle]);

  // Populate thread from loaded history
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.filter((m) => m.role !== "system"));
    }
  }, [messagesQuery.data]);

  const selectCourse = (course: StudentPortalCourse) => {
    if (course.courseId === selectedCourseId) return;
    setSelectedCourseId(course.courseId);
    setSelectedLessonId(null);
    setLessonTitle(null);
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    setPendingLessonId(undefined);
    setPendingChatTitle(undefined);
  };

  // Video courses: set lesson context (lessonId passed to createChat)
  const selectLesson = (lessonId: number, title: string) => {
    setSelectedLessonId(lessonId);
    setLessonTitle(title);
    setPendingLessonId(lessonId);
    setPendingChatTitle(undefined);
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Live/offline courses: set session context (title passed to createChat, no lessonId)
  const selectSession = (sessionId: number, title: string) => {
    setSelectedLessonId(sessionId);
    setLessonTitle(title);
    setPendingLessonId(undefined);
    setPendingChatTitle(`Session: ${title}`);
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const resumeChat = (chat: AiChat) => {
    setActiveChatId(chat.id);
    setSelectedLessonId(null);
    setLessonTitle(null);
    setPendingLessonId(undefined);
    setPendingChatTitle(undefined);
    setSuggestions([]);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setSuggestions([]);
    setLessonTitle(null);
    setSelectedLessonId(null);
    setPendingLessonId(undefined);
    setPendingChatTitle(undefined);
    inputRef.current?.focus();
  };

  const send = async (text: string) => {
    if (!text.trim() || sending || !selectedCourseId) return;
    setInput("");
    setSuggestions([]);
    setSending(true);

    const tempId = Date.now();
    setMessages((prev) => [...prev, { id: tempId, chatId: activeChatId ?? 0, role: "user", content: text, createdAt: new Date().toISOString() }]);

    try {
      let chatId = activeChatId;
      if (!chatId) {
        const newChat = await createChat.mutateAsync({ courseId: selectedCourseId, lessonId: pendingLessonId, title: pendingChatTitle });
        chatId = newChat.id;
        setActiveChatId(chatId);
        if (newChat.lessonTitle) setLessonTitle(newChat.lessonTitle);
        setPendingLessonId(undefined);
        setPendingChatTitle(undefined);
      }
      const result = await sendMessage.mutateAsync({ chatId, content: text });
      setMessages((prev) => [...prev, result.message]);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      const msg =
        code === "AI_ASSISTANT_DISABLED"
          ? "AI Tutor is not enabled for this course. Ask your instructor to enable it in Course Studio."
          : code === "FEATURE_DISABLED"
            ? "The AI Tutor feature is not enabled for this organization."
            : code === "AI_DAILY_LIMIT_REACHED"
              ? "You've reached today's message limit. Try again tomorrow."
              : code === "AI_ASSISTANT_CONFIG_MISSING"
                ? "The AI Tutor isn't configured on the server yet. Contact your administrator."
                : code === "AI_ENROLLMENT_REQUIRED"
                  ? "You need to be enrolled in this course to use the AI Tutor."
                  : "Failed to send message. Please try again.";
      toast.error(msg);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const chips = lessonTitle
    ? (isVideoType ? LESSON_CHIPS : SESSION_CHIPS)
    : COURSE_CHIPS;
  const chatContext = lessonTitle ?? selectedCourse?.title ?? null;
  const contextPrefix = lessonTitle ? (isVideoType ? "Lesson" : "Session") : null;

  return (
    <DashboardShell>
      <TopBar
        title="AI Tutor"
        subtitle={chatContext ? `Studying: ${chatContext}` : "Pick a course to get started"}
        showStreak={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">

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
                  {lessonTitle ? `${contextPrefix}: ${lessonTitle}` : selectedCourse ? selectedCourse.title : "Choose a course below"}
                </p>
              </div>
            </div>
            {(activeChatId || messages.length > 0) && (
              <button onClick={startNewChat} className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted">
                <Plus className="size-3.5" /> New chat
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {/* State 1: no course — show course cards */}
            {!selectedCourseId ? (
              <div className="h-full flex flex-col justify-center gap-5 py-6">
                <div className="text-center">
                  <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow mx-auto mb-3">
                    <Bot className="size-8" strokeWidth={1.5} />
                  </div>
                  <p className="font-black text-xl">What would you like to study?</p>
                  <p className="text-sm font-medium text-foreground/55 mt-1">Pick a course and I'll tutor you on it.</p>
                </div>
                {coursesQuery.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-center text-sm font-medium text-foreground/50">No courses with AI Tutor enabled. Ask your instructor to turn it on in Course Studio.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {courses.map((c) => (
                      <button
                        key={c.courseId}
                        onClick={() => selectCourse(c)}
                        className="text-left rounded-2xl border-2 border-border bg-muted/30 p-4 hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all chunky-shadow"
                      >
                        <p className="font-black text-sm truncate">{c.title}</p>
                        {c.courseType === "video" && c.nextLesson && (
                          <p className="text-xs font-bold text-primary mt-1 truncate">→ {c.nextLesson.title}</p>
                        )}
                        {c.courseType !== "video" && c.nextSession?.sessionTitle && (
                          <p className="text-xs font-bold text-primary mt-1 truncate flex items-center gap-1">
                            <CalendarClock className="size-3 shrink-0" /> {c.nextSession.sessionTitle}
                          </p>
                        )}
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60" style={{ width: `${c.progressPercent}%` }} />
                        </div>
                        <p className="text-[10px] font-black text-foreground/40 mt-1">{c.progressPercent}% complete</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            /* State 2: course selected, loading history */
            ) : messagesQuery.isLoading ? (
              <div className="space-y-4 pt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                    <div className="size-8 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div className="h-12 rounded-2xl bg-muted animate-pulse" style={{ width: `${40 + i * 15}%` }} />
                  </div>
                ))}
              </div>

            /* State 3: no messages yet — starter chips */
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
                <div className="size-14 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow">
                  <Bot className="size-7" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-black text-lg">
                    {lessonTitle
                      ? `Ready to work on "${lessonTitle}"`
                      : `Hi! Ask me anything about ${selectedCourse?.title}.`}
                  </p>
                  <p className="text-sm font-medium text-foreground/55 mt-1">
                    {lessonTitle
                      ? `Pick a starting point or type your own question.`
                      : isVideoType
                        ? "Pick a lesson from the sidebar or type your own question."
                        : "Pick a session from the sidebar or type your own question."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => send(chip)}
                      className="px-4 py-3 rounded-2xl border-2 border-primary/30 bg-primary/8 text-primary text-xs font-bold hover:bg-primary/15 transition-colors text-left leading-snug"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

            /* State 4: messages */
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
                  <button key={s} type="button" onClick={() => send(s)} className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 flex gap-2">
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

        {/* ── Sidebar ── */}
        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow flex flex-col gap-4 overflow-y-auto">

          {/* Course switcher */}
          <div>
            <h3 className="font-black text-sm flex items-center gap-2 mb-2">
              <BookOpen className="size-4 text-primary" /> Your courses
            </h3>
            {coursesQuery.isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />)}</div>
            ) : (
              <ul className="space-y-1.5">
                {courses.map((c) => {
                  const active = c.courseId === selectedCourseId;
                  return (
                    <li key={c.courseId}>
                      <button
                        onClick={() => selectCourse(c)}
                        className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 transition-all ${active ? "border-primary bg-primary/10 -translate-y-0.5 chunky-shadow" : "border-border hover:bg-muted hover:-translate-y-0.5"}`}
                      >
                        <p className={`text-xs font-black truncate ${active ? "text-primary" : ""}`}>{c.title}</p>
                        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${active ? "bg-primary" : "bg-foreground/30"}`} style={{ width: `${c.progressPercent}%` }} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Content picker — only when a course is selected */}
          {selectedCourseId && (
            <div className="border-t-2 border-border pt-4">
              <button
                onClick={() => setSectionsOpen((v) => !v)}
                className="w-full flex items-center justify-between mb-2"
              >
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  {isVideoType ? "Lessons" : "Sessions"}
                </h3>
                {sectionsOpen ? <ChevronDown className="size-3.5 text-foreground/40" /> : <ChevronRight className="size-3.5 text-foreground/40" />}
              </button>

              {sectionsOpen && (
                isVideoType ? (
                  /* ── Video: sections → lessons ── */
                  <>
                    {selectedCourse?.nextLesson && (
                      <button
                        onClick={() => selectLesson(selectedCourse.nextLesson!.lessonId, selectedCourse.nextLesson!.title)}
                        className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 mb-2 transition-all ${
                          selectedLessonId === selectedCourse.nextLesson.lessonId
                            ? "border-primary bg-primary/10"
                            : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">Continue from</p>
                        <p className="text-xs font-black text-primary truncate">{selectedCourse.nextLesson.title}</p>
                      </button>
                    )}
                    {courseDetailQuery.isLoading ? (
                      <div className="space-y-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-muted" />)}</div>
                    ) : sections.length === 0 ? (
                      <p className="text-xs font-medium text-foreground/40">No lessons found.</p>
                    ) : (
                      <div className="space-y-3">
                        {sections.map((section) => (
                          <div key={section.sectionId}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mb-1 px-1">{section.title}</p>
                            <ul className="space-y-1">
                              {section.lessons.map((lesson) => {
                                const isSelected = lesson.lessonId === selectedLessonId;
                                return (
                                  <li key={lesson.lessonId}>
                                    <button
                                      onClick={() => selectLesson(lesson.lessonId, lesson.title)}
                                      className={`w-full text-left rounded-xl border-2 px-3 py-2 flex items-center gap-2 transition-all text-xs font-bold ${
                                        isSelected
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-transparent hover:border-border hover:bg-muted text-foreground/80"
                                      }`}
                                    >
                                      {lesson.completed
                                        ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                                        : <span className={`size-3.5 shrink-0 rounded-full border-2 ${isSelected ? "border-primary" : "border-foreground/30"}`} />
                                      }
                                      <span className="truncate">{lesson.title}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Live/Offline: sessions ── */
                  <>
                    {selectedCourse?.nextSession?.sessionTitle && (
                      <button
                        onClick={() => {
                          const ns = selectedCourse.nextSession!;
                          selectSession(ns.id ?? 0, ns.sessionTitle!);
                        }}
                        className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 mb-2 transition-all ${
                          lessonTitle === selectedCourse.nextSession.sessionTitle
                            ? "border-primary bg-primary/10"
                            : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">Next session</p>
                        <p className="text-xs font-black text-primary truncate">{selectedCourse.nextSession.sessionTitle}</p>
                      </button>
                    )}
                    {courseDetailQuery.isLoading ? (
                      <div className="space-y-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />)}</div>
                    ) : sessions.length === 0 ? (
                      <p className="text-xs font-medium text-foreground/40">No sessions found.</p>
                    ) : (
                      <ul className="space-y-1">
                        {sessions.map((session) => {
                          const isSelected = session.id === selectedLessonId;
                          const dateStr = session.startsAt ?? session.startAt;
                          const isUpcoming = session.status === "scheduled" || session.status === "upcoming";
                          const isDone = session.status === "completed" || session.status === "done";
                          return (
                            <li key={session.id}>
                              <button
                                onClick={() => selectSession(session.id, session.sessionTitle)}
                                className={`w-full text-left rounded-xl border-2 px-3 py-2 transition-all text-xs font-bold ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-transparent hover:border-border hover:bg-muted text-foreground/80"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isDone
                                    ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                                    : isUpcoming
                                      ? <Clock className={`size-3.5 shrink-0 ${isSelected ? "text-primary" : "text-amber-500"}`} strokeWidth={2.5} />
                                      : <span className={`size-3.5 shrink-0 rounded-full border-2 ${isSelected ? "border-primary" : "border-foreground/30"}`} />
                                  }
                                  <span className="truncate flex-1">{session.sessionTitle}</span>
                                  <span className="text-[10px] font-black text-foreground/35 shrink-0">#{session.sessionIndex}</span>
                                </div>
                                {(dateStr || session.location) && (
                                  <div className="mt-0.5 ml-5 flex items-center gap-2 text-[10px] font-medium text-foreground/45">
                                    {dateStr && <span>{new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                                    {session.location && <span className="flex items-center gap-0.5"><MapPin className="size-2.5" />{session.location}</span>}
                                  </div>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )
              )}
            </div>
          )}

          {/* Recent chats */}
          {selectedCourseId && chatsQuery.data && chatsQuery.data.length > 0 && (
            <div className="border-t-2 border-border pt-4 mt-auto">
              <h3 className="font-black text-sm flex items-center gap-2 mb-2">
                <MessageSquare className="size-4 text-primary" /> Recent chats
              </h3>
              <ul className="space-y-1.5">
                {chatsQuery.data.slice(0, 5).map((chat) => {
                  const isActive = chat.id === activeChatId;
                  return (
                    <li key={chat.id}>
                      <button
                        onClick={() => resumeChat(chat)}
                        className={`w-full text-left rounded-xl border-2 px-3 py-2 transition-all ${isActive ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                      >
                        <p className={`text-xs font-black truncate ${isActive ? "text-primary" : ""}`}>
                          {chat.title ?? new Date(chat.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-[10px] font-medium text-foreground/45 mt-0.5">
                          {chat.messagesCount} message{chat.messagesCount !== 1 ? "s" : ""}
                          {chat.lastMessageAt ? ` · ${new Date(chat.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {activeChatId && (
                <button
                  onClick={startNewChat}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-muted px-3 py-2 text-xs font-bold hover:bg-foreground/10 transition-colors"
                >
                  <RotateCcw className="size-3.5" /> Start new chat
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

// ─── Bubble & markdown helpers ────────────────────────────────────────────────

function Bubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
        {isUser ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed ${isUser ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow whitespace-pre-wrap" : "bg-muted border-border rounded-bl-md"}`}>
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
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="rounded bg-background/50 px-1 font-mono text-xs">{p.slice(1, -1)}</code>;
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
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s/, ""));
      nodes.push(<ol key={i} className="list-decimal list-inside space-y-0.5 my-1">{items.map((t, j) => <li key={j}><MdInline text={t} /></li>)}</ol>);
    } else if (/^[-•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-•]\s/, ""));
      nodes.push(<ul key={i} className="list-disc list-inside space-y-0.5 my-1">{items.map((t, j) => <li key={j}><MdInline text={t} /></li>)}</ul>);
    } else {
      nodes.push(<p key={i}><MdInline text={line} /></p>);
      i++;
    }
  }
  return <div className="space-y-1.5">{nodes}</div>;
}

function Dot({ delay = 0 }: { delay?: number }) {
  return <span className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />;
}

// ─── Prototype fallback ───────────────────────────────────────────────────────

type PrototypeMsg = { id: string; role: "user" | "tutor"; text: string };

const MOCK_COURSES = [
  { id: 1, courseType: "video" as const, title: "Cognitive Psychology", progress: 45, next: "Working Memory Models" },
  { id: 2, courseType: "video" as const, title: "Organic Chemistry II", progress: 30, next: "Nucleophilic Substitution" },
  { id: 3, courseType: "offline" as const, title: "Math · Grade 10A", progress: 60, next: "Trigonometry Practice" },
];

const MOCK_LESSONS: Record<number, { id: number; title: string; completed: boolean }[]> = {
  1: [
    { id: 1, title: "Introduction to Memory", completed: true },
    { id: 2, title: "Short-Term vs Long-Term Memory", completed: true },
    { id: 3, title: "Working Memory Models", completed: false },
    { id: 4, title: "Phonological Loop", completed: false },
    { id: 5, title: "Visuospatial Sketchpad", completed: false },
  ],
  2: [
    { id: 6, title: "Organic Nomenclature Review", completed: true },
    { id: 7, title: "Reaction Mechanisms", completed: false },
    { id: 8, title: "Nucleophilic Substitution", completed: false },
    { id: 9, title: "Elimination Reactions", completed: false },
  ],
};

const MOCK_SESSIONS: Record<number, { id: number; index: number; title: string; date: string; status: "completed" | "upcoming" }[]> = {
  3: [
    { id: 101, index: 9,  title: "Algebra Review",             date: "May 12", status: "completed" },
    { id: 102, index: 10, title: "Introduction to Trigonometry", date: "May 19", status: "completed" },
    { id: 103, index: 11, title: "Sine, Cosine & Tangent",     date: "May 26", status: "completed" },
    { id: 104, index: 12, title: "Trigonometry Practice",      date: "Jun 9",  status: "upcoming" },
    { id: 105, index: 13, title: "Trigonometric Identities",   date: "Jun 16", status: "upcoming" },
  ],
};

const INITIAL: PrototypeMsg[] = [
  { id: "0", role: "tutor", text: "Hi! I'm your AI tutor. Ask me about any lesson, or paste a problem you're stuck on. I'll guide you step by step — not just hand over the answer." },
];

function PrototypeAiTutorPage() {
  const [messages, setMessages] = useState<PrototypeMsg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCourse = MOCK_COURSES.find((c) => c.id === selectedCourseId) ?? null;
  const isVideoType = selectedCourse?.courseType === "video";
  const lessons = isVideoType && selectedCourseId ? MOCK_LESSONS[selectedCourseId] ?? [] : [];
  const sessions = !isVideoType && selectedCourseId ? MOCK_SESSIONS[selectedCourseId] ?? [] : [];
  const selectedContext = isVideoType
    ? (lessons.find((l) => l.id === selectedContextId) ?? null)
    : (sessions.find((s) => s.id === selectedContextId) ?? null);
  const contextTitle = selectedContext ? ("title" in selectedContext ? selectedContext.title : null) : null;

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

  const pickCourse = (id: number) => {
    setSelectedCourseId(id);
    setSelectedContextId(null);
  };

  const pickLesson = (id: number, title: string) => {
    setSelectedContextId(id);
    send(`Let's study: ${title}`);
  };

  const pickSession = (id: number, title: string) => {
    setSelectedContextId(id);
    send(`Let's prepare for session: ${title}`);
  };

  const chips = contextTitle
    ? (isVideoType ? LESSON_CHIPS : SESSION_CHIPS)
    : selectedCourse ? COURSE_CHIPS : [];

  return (
    <DashboardShell>
      <TopBar
        title="AI Tutor"
        subtitle={contextTitle ? `${isVideoType ? "Lesson" : "Session"}: ${contextTitle}` : selectedCourse ? `Course: ${selectedCourse.title}` : "Pick a course to get started"}
        showStreak={false}
      />

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
            <button onClick={() => { setMessages(INITIAL); setSelectedContextId(null); }} className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted">
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!selectedCourseId ? (
              <div className="h-full flex flex-col justify-center gap-5 py-6">
                <div className="text-center">
                  <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow mx-auto mb-3">
                    <Bot className="size-8" strokeWidth={1.5} />
                  </div>
                  <p className="font-black text-xl">What would you like to study?</p>
                  <p className="text-sm font-medium text-foreground/55 mt-1">Pick a course and I'll tutor you on it.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_COURSES.map((c) => (
                    <button key={c.id} onClick={() => pickCourse(c.id)} className="text-left rounded-2xl border-2 border-border bg-muted/30 p-4 hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all chunky-shadow">
                      <p className="font-black text-sm">{c.title}</p>
                      <p className="text-xs font-bold text-primary mt-1 flex items-center gap-1">
                        {c.courseType !== "video" && <CalendarClock className="size-3 shrink-0" />}
                        → {c.next}
                      </p>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60" style={{ width: `${c.progress}%` }} />
                      </div>
                      <p className="text-[10px] font-black text-foreground/40 mt-1">{c.progress}% complete</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.length === 1 && messages[0].id === "0" ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
                <div className="size-14 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow">
                  <Bot className="size-7" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-black text-lg">{contextTitle ? `Ready to work on "${contextTitle}"` : `Hi! Ask me anything about ${selectedCourse?.title}.`}</p>
                  <p className="text-sm font-medium text-foreground/55 mt-1">
                    {contextTitle ? "Pick a starting point or type your own question." : isVideoType ? "Pick a lesson from the sidebar or ask freely." : "Pick a session from the sidebar or ask freely."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2">
                  {chips.map((chip) => (
                    <button key={chip} onClick={() => send(chip)} className="px-4 py-3 rounded-2xl border-2 border-primary/30 bg-primary/8 text-primary text-xs font-bold hover:bg-primary/15 transition-colors text-left leading-snug">
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    {m.role === "user" ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
                  </div>
                  <div className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow" : "bg-muted border-border rounded-bl-md"}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
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

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t-2 border-border p-3 flex gap-2 bg-background">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedCourseId ? "Ask the tutor anything…" : "Select a course first"}
              disabled={!selectedCourseId}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50 disabled:opacity-50"
            />
            <button type="submit" disabled={!input.trim() || typing || !selectedCourseId} className="size-12 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow disabled:opacity-50">
              {typing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.5} />}
            </button>
          </form>
        </section>

        {/* Prototype sidebar */}
        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="font-black text-sm flex items-center gap-2 mb-2">
              <BookOpen className="size-4 text-primary" /> Your courses
            </h3>
            <ul className="space-y-1.5">
              {MOCK_COURSES.map((c) => (
                <li key={c.id}>
                  <button onClick={() => pickCourse(c.id)} className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 transition-all ${selectedCourseId === c.id ? "border-primary bg-primary/10 -translate-y-0.5 chunky-shadow" : "border-border hover:bg-muted hover:-translate-y-0.5"}`}>
                    <p className={`text-xs font-black truncate ${selectedCourseId === c.id ? "text-primary" : ""}`}>{c.title}</p>
                    <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${selectedCourseId === c.id ? "bg-primary" : "bg-foreground/30"}`} style={{ width: `${c.progress}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selectedCourseId && (
            <div className="border-t-2 border-border pt-4">
              <button onClick={() => setSectionsOpen((v) => !v)} className="w-full flex items-center justify-between mb-2">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  {isVideoType ? "Lessons" : "Sessions"}
                </h3>
                {sectionsOpen ? <ChevronDown className="size-3.5 text-foreground/40" /> : <ChevronRight className="size-3.5 text-foreground/40" />}
              </button>
              {sectionsOpen && (
                isVideoType ? (
                  <>
                    {selectedCourse && (
                      <button
                        onClick={() => { const next = lessons.find((l) => !l.completed); if (next) pickLesson(next.id, next.title); }}
                        className="w-full text-left rounded-2xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-2.5 mb-2 transition-all"
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">Continue from</p>
                        <p className="text-xs font-black text-primary truncate">{selectedCourse.next}</p>
                      </button>
                    )}
                    <ul className="space-y-1">
                      {lessons.map((l) => (
                        <li key={l.id}>
                          <button onClick={() => pickLesson(l.id, l.title)} className={`w-full text-left rounded-xl border-2 px-3 py-2 flex items-center gap-2 transition-all text-xs font-bold ${selectedContextId === l.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-border hover:bg-muted text-foreground/80"}`}>
                            {l.completed
                              ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                              : <span className={`size-3.5 shrink-0 rounded-full border-2 ${selectedContextId === l.id ? "border-primary" : "border-foreground/30"}`} />
                            }
                            <span className="truncate">{l.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    {selectedCourse && (
                      <button
                        onClick={() => { const next = sessions.find((s) => s.status === "upcoming"); if (next) pickSession(next.id, next.title); }}
                        className="w-full text-left rounded-2xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-2.5 mb-2 transition-all"
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">Next session</p>
                        <p className="text-xs font-black text-primary truncate">{selectedCourse.next}</p>
                      </button>
                    )}
                    <ul className="space-y-1">
                      {sessions.map((s) => (
                        <li key={s.id}>
                          <button onClick={() => pickSession(s.id, s.title)} className={`w-full text-left rounded-xl border-2 px-3 py-2 transition-all text-xs font-bold ${selectedContextId === s.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-border hover:bg-muted text-foreground/80"}`}>
                            <div className="flex items-center gap-2">
                              {s.status === "completed"
                                ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                                : <Clock className={`size-3.5 shrink-0 ${selectedContextId === s.id ? "text-primary" : "text-amber-500"}`} strokeWidth={2.5} />
                              }
                              <span className="truncate flex-1">{s.title}</span>
                              <span className="text-[10px] font-black text-foreground/35 shrink-0">#{s.index}</span>
                            </div>
                            <p className="text-[10px] font-medium text-foreground/45 mt-0.5 ml-5">{s.date}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )
              )}
            </div>
          )}

          {!selectedCourseId && (
            <div className="mt-auto p-3 rounded-2xl bg-accent/15 border-2 border-accent/30">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-1">Tip</p>
              <p className="text-xs font-medium">Paste a quiz question or a paragraph from your textbook — the tutor will adapt.</p>
            </div>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

function tutorReply(q: string): string {
  const t = q.toLowerCase();
  if (/quiz me|quiz|test me/.test(t))
    return "Great — quick question:\n\nWhich component of working memory rehearses verbal information?\n  A) Visuospatial sketchpad\n  B) Phonological loop\n  C) Central executive\n  D) Episodic buffer\n\nType A, B, C, or D and I'll explain!";
  if (/3x ?\+ ?7/.test(t))
    return "Let's walk through it together:\n\n1. Start with 3x + 7 = 22.\n2. Subtract 7 from both sides → 3x = 15.\n3. Divide both sides by 3 → x = 5.\n\nWant to try one yourself? Try: 4y − 6 = 14.";
  if (/working memory|like i'?m 12/.test(t))
    return "Think of working memory as a tiny mental whiteboard 🧠 — you can scribble about 4 things on it at once. If you don't keep going over them, they fade. That's why repeating a phone number out loud helps you remember it long enough to dial.";
  if (/french revolution/.test(t))
    return "Sure! Here's a fast 5-bullet summary:\n• 1789: Estates-General → Tennis Court Oath; revolution begins.\n• Bastille stormed (Jul 14) — symbol of popular uprising.\n• Declaration of the Rights of Man and of the Citizen.\n• Reign of Terror (1793–94) under Robespierre.\n• Ends with Napoleon's coup in 1799.";
  if (/let'?s study|study:|prepare for session|session:/.test(t))
    return "Perfect! I've loaded the context for that. What would you like to focus on — should I explain the key concepts, quiz you, or help you work through a specific part?";
  if (/summary|summarize|remember/.test(t))
    return "Here are the key points to remember:\n\n1. **Core idea** — the main concept builds on prior knowledge.\n2. **Key terms** — know your vocabulary cold before the exam.\n3. **Common mistakes** — students often confuse similar terms; focus on definitions.\n4. **Real-world link** — connect it to something you already know.\n\nWant me to go deeper on any of these?";
  if (/explain|step by step|hard/.test(t))
    return "Let's break it down step by step. What do you already know about this topic? Even a rough idea helps me meet you where you are.";
  return "Good question. Let's break it down step by step — what do you already know about it? Even a rough idea helps me meet you where you are.";
}
