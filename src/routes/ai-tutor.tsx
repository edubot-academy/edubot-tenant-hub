import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
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
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/ai-tutor")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.aiTutor.metaTitle", { appName: i18n.t("app.name") }) }] }),
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    lessonId: z.coerce.number().optional(),
  }),
  component: AiTutorPage,
});

type Translate = (key: string, options?: Record<string, unknown>) => string;
type CourseDetailSession = {
  id: number;
  sessionTitle: string;
  startsAt?: string | null;
  startAt?: string | null;
  status?: string | null;
  sessionIndex?: number | null;
  location?: string | null;
};

type CourseDetailLesson = {
  lessonId: number;
  title: string;
  completed?: boolean;
};

type CourseDetailSection = {
  sectionId: number;
  title: string;
  lessons: CourseDetailLesson[];
};

function chipsForContext(t: Translate, hasContext: boolean, isVideoType: boolean) {
  if (hasContext) {
    return isVideoType
      ? [
        t("studentPages.aiTutor.chips.lessonExplain"),
        t("studentPages.aiTutor.chips.lessonQuiz"),
        t("studentPages.aiTutor.chips.stuck"),
        t("studentPages.aiTutor.chips.lessonSummary"),
      ]
      : [
        t("studentPages.aiTutor.chips.sessionPrepare"),
        t("studentPages.aiTutor.chips.sessionSummary"),
        t("studentPages.aiTutor.chips.classConfused"),
        t("studentPages.aiTutor.chips.sessionQuiz"),
      ];
  }

  return [
    t("studentPages.aiTutor.chips.courseCatchUp"),
    t("studentPages.aiTutor.chips.courseQuiz"),
    t("studentPages.aiTutor.chips.stuck"),
    t("studentPages.aiTutor.chips.exercise"),
  ];
}

function aiErrorMessage(t: Translate, err: unknown) {
  const code = err instanceof ApiError ? err.code : null;
  if (code === "AI_ASSISTANT_DISABLED") return t("studentPages.aiTutor.errors.assistantDisabled");
  if (code === "FEATURE_DISABLED") return t("studentPages.aiTutor.errors.featureDisabled");
  if (code === "AI_DAILY_LIMIT_REACHED") return t("studentPages.aiTutor.errors.dailyLimit");
  if (code === "AI_ASSISTANT_CONFIG_MISSING") return t("studentPages.aiTutor.errors.configMissing");
  if (code === "AI_ENROLLMENT_REQUIRED") return t("studentPages.aiTutor.errors.enrollmentRequired");
  return t("studentPages.aiTutor.errors.sendFailed");
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function AiTutorPage() {
  const { context } = useAppContext();
  if (context.mode !== "backend") return <PrototypeAiTutorPage />;
  return <BackendAiTutorPage />;
}

function BackendAiTutorPage() {
  const { t } = useTranslation();
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
  const courses = (coursesQuery.data ?? []).filter((course) => course.aiAssistantEnabled);
  const selectedCourse = courses.find((course) => course.courseId === selectedCourseId) ?? null;

  const courseDetailQuery = useStudentPortalCourseDetail(selectedCourseId, selectedCourse?.groupId ?? null);
  const sections = (courseDetailQuery.data?.sections ?? []) as CourseDetailSection[];
  const sessions = (courseDetailQuery.data?.sessions ?? []) as CourseDetailSession[];
  const isVideoType = selectedCourse?.courseType === "video";

  const aiEnabledCourseId = selectedCourse?.aiAssistantEnabled ? selectedCourseId : null;
  const chatsQuery = useAiChats(aiEnabledCourseId);
  const messagesQuery = useAiMessages(activeChatId);
  const createChat = useCreateAiChat();
  const sendMessage = useSendAiMessage();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!paramCourseId || !coursesQuery.data) return;
    if (courses.find((course) => course.courseId === paramCourseId)) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId, courses, coursesQuery.data]);

  useEffect(() => {
    if (!chatsQuery.data) return;
    if (pendingLessonId || pendingChatTitle) {
      setActiveChatId(null);
      setMessages([]);
      return;
    }

    const sorted = [...chatsQuery.data].sort(
      (a, b) => new Date(b.lastMessageAt ?? b.createdAt).getTime() - new Date(a.lastMessageAt ?? a.createdAt).getTime(),
    );
    setActiveChatId(sorted[0]?.id ?? null);
    if (sorted.length === 0) setMessages([]);
  }, [chatsQuery.data, pendingLessonId, pendingChatTitle]);

  useEffect(() => {
    if (messagesQuery.data) setMessages(messagesQuery.data.filter((message) => message.role !== "system"));
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

  const selectSession = (sessionId: number, title: string) => {
    setSelectedLessonId(sessionId);
    setLessonTitle(title);
    setPendingLessonId(undefined);
    setPendingChatTitle(`${t("studentPages.aiTutor.session")}: ${title}`);
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
      toast.error(aiErrorMessage(t, err));
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const chips = chipsForContext(t, Boolean(lessonTitle), Boolean(isVideoType));
  const chatContext = lessonTitle ?? selectedCourse?.title ?? null;
  const contextPrefix = lessonTitle ? (isVideoType ? t("studentPages.aiTutor.lesson") : t("studentPages.aiTutor.session")) : null;

  return (
    <DashboardShell>
      <TopBar
        title={t("studentPages.aiTutor.title")}
        subtitle={chatContext ? t("studentPages.aiTutor.studying", { context: chatContext }) : t("studentPages.aiTutor.pickCourseSubtitle")}
        showStreak={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b-2 border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                <Bot className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black">{t("studentPages.aiTutor.assistantName")}</p>
                <p className="text-[11px] font-bold text-foreground/55 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {lessonTitle ? `${contextPrefix}: ${lessonTitle}` : selectedCourse ? selectedCourse.title : t("studentPages.aiTutor.chooseCourse")}
                </p>
              </div>
            </div>
            {(activeChatId || messages.length > 0) && (
              <button onClick={startNewChat} className="px-3 py-1.5 rounded-xl bg-card border-2 border-border font-bold text-xs flex items-center gap-1.5 hover:bg-muted">
                <Plus className="size-3.5" /> {t("studentPages.aiTutor.newChat")}
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!selectedCourseId ? (
              <CoursePicker
                courses={courses}
                isLoading={coursesQuery.isLoading}
                onSelect={selectCourse}
                t={t}
              />
            ) : messagesQuery.isLoading ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <StarterPanel
                title={lessonTitle ? t("studentPages.aiTutor.readyForLesson", { title: lessonTitle }) : t("studentPages.aiTutor.askAnything", { title: selectedCourse?.title ?? "" })}
                subtitle={lessonTitle
                  ? t("studentPages.aiTutor.starterWithContext")
                  : isVideoType
                    ? t("studentPages.aiTutor.starterVideo")
                    : t("studentPages.aiTutor.starterSession")}
                chips={chips}
                onSend={send}
              />
            ) : (
              messages.map((message) => <Bubble key={message.id} msg={message} />)
            )}

            {sending && <TypingBubble />}
          </div>

          <div className="border-t-2 border-border bg-background shrink-0">
            {suggestions.length > 0 && !sending && (
              <div className="px-3 pt-2 pb-1 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => send(suggestion)} className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="p-3 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={selectedCourseId ? t("studentPages.aiTutor.inputPlaceholder") : t("studentPages.aiTutor.selectCoursePlaceholder")}
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

        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow flex flex-col gap-4 overflow-y-auto">
          <CourseList courses={courses} selectedCourseId={selectedCourseId} isLoading={coursesQuery.isLoading} onSelect={selectCourse} t={t} />

          {selectedCourseId && (
            <ContentPicker
              isVideoType={Boolean(isVideoType)}
              sections={sections}
              sessions={sessions}
              isLoading={courseDetailQuery.isLoading}
              selectedCourse={selectedCourse}
              selectedLessonId={selectedLessonId}
              lessonTitle={lessonTitle}
              sectionsOpen={sectionsOpen}
              onToggleOpen={() => setSectionsOpen((value) => !value)}
              onSelectLesson={selectLesson}
              onSelectSession={selectSession}
              t={t}
            />
          )}

          {selectedCourseId && chatsQuery.data && chatsQuery.data.length > 0 && (
            <RecentChats chats={chatsQuery.data} activeChatId={activeChatId} onResume={resumeChat} onStartNew={startNewChat} t={t} />
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

function CoursePicker({ courses, isLoading, onSelect, t }: { courses: StudentPortalCourse[]; isLoading: boolean; onSelect: (course: StudentPortalCourse) => void; t: Translate }) {
  return (
    <div className="h-full flex flex-col justify-center gap-5 py-6">
      <div className="text-center">
        <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow mx-auto mb-3">
          <Bot className="size-8" strokeWidth={1.5} />
        </div>
        <p className="font-black text-xl">{t("studentPages.aiTutor.emptyTitle")}</p>
        <p className="text-sm font-medium text-foreground/55 mt-1">{t("studentPages.aiTutor.emptyBody")}</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2].map((index) => <div key={index} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-center text-sm font-medium text-foreground/50">{t("studentPages.aiTutor.noEnabledCourses")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.map((course) => (
            <button key={course.courseId} onClick={() => onSelect(course)} className="text-left rounded-2xl border-2 border-border bg-muted/30 p-4 hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all chunky-shadow">
              <p className="font-black text-sm truncate">{course.title}</p>
              {course.courseType === "video" && course.nextLesson && <p className="text-xs font-bold text-primary mt-1 truncate">→ {course.nextLesson.title}</p>}
              {course.courseType !== "video" && course.nextSession?.sessionTitle && (
                <p className="text-xs font-bold text-primary mt-1 truncate flex items-center gap-1">
                  <CalendarClock className="size-3 shrink-0" /> {course.nextSession.sessionTitle}
                </p>
              )}
              <ProgressBar value={course.progressPercent} />
              <p className="text-[10px] font-black text-foreground/40 mt-1">{t("studentPages.aiTutor.progressComplete", { value: course.progressPercent })}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseList({ courses, selectedCourseId, isLoading, onSelect, t }: { courses: StudentPortalCourse[]; selectedCourseId: number | null; isLoading: boolean; onSelect: (course: StudentPortalCourse) => void; t: Translate }) {
  return (
    <div>
      <h3 className="font-black text-sm flex items-center gap-2 mb-2">
        <BookOpen className="size-4 text-primary" /> {t("studentPages.aiTutor.yourCourses")}
      </h3>
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((index) => <div key={index} className="h-12 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : (
        <ul className="space-y-1.5">
          {courses.map((course) => {
            const active = course.courseId === selectedCourseId;
            return (
              <li key={course.courseId}>
                <button onClick={() => onSelect(course)} className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 transition-all ${active ? "border-primary bg-primary/10 -translate-y-0.5 chunky-shadow" : "border-border hover:bg-muted hover:-translate-y-0.5"}`}>
                  <p className={`text-xs font-black truncate ${active ? "text-primary" : ""}`}>{course.title}</p>
                  <ProgressBar value={course.progressPercent} active={active} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ContentPicker({
  isVideoType,
  sections,
  sessions,
  isLoading,
  selectedCourse,
  selectedLessonId,
  lessonTitle,
  sectionsOpen,
  onToggleOpen,
  onSelectLesson,
  onSelectSession,
  t,
}: {
  isVideoType: boolean;
  sections: CourseDetailSection[];
  sessions: CourseDetailSession[];
  isLoading: boolean;
  selectedCourse: StudentPortalCourse | null;
  selectedLessonId: number | null;
  lessonTitle: string | null;
  sectionsOpen: boolean;
  onToggleOpen: () => void;
  onSelectLesson: (lessonId: number, title: string) => void;
  onSelectSession: (sessionId: number, title: string) => void;
  t: Translate;
}) {
  return (
    <div className="border-t-2 border-border pt-4">
      <button onClick={onToggleOpen} className="w-full flex items-center justify-between mb-2">
        <h3 className="font-black text-sm flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          {isVideoType ? t("studentPages.aiTutor.lessons") : t("studentPages.aiTutor.sessions")}
        </h3>
        {sectionsOpen ? <ChevronDown className="size-3.5 text-foreground/40" /> : <ChevronRight className="size-3.5 text-foreground/40" />}
      </button>

      {sectionsOpen && (isVideoType ? (
        <VideoLessonPicker
          sections={sections}
          isLoading={isLoading}
          selectedCourse={selectedCourse}
          selectedLessonId={selectedLessonId}
          onSelectLesson={onSelectLesson}
          t={t}
        />
      ) : (
        <SessionPicker
          sessions={sessions}
          isLoading={isLoading}
          selectedCourse={selectedCourse}
          selectedLessonId={selectedLessonId}
          lessonTitle={lessonTitle}
          onSelectSession={onSelectSession}
          t={t}
        />
      ))}
    </div>
  );
}

function VideoLessonPicker({ sections, isLoading, selectedCourse, selectedLessonId, onSelectLesson, t }: { sections: CourseDetailSection[]; isLoading: boolean; selectedCourse: StudentPortalCourse | null; selectedLessonId: number | null; onSelectLesson: (lessonId: number, title: string) => void; t: Translate }) {
  return (
    <>
      {selectedCourse?.nextLesson && (
        <button onClick={() => onSelectLesson(selectedCourse.nextLesson!.lessonId, selectedCourse.nextLesson!.title)} className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 mb-2 transition-all ${selectedLessonId === selectedCourse.nextLesson.lessonId ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">{t("studentPages.aiTutor.continueFrom")}</p>
          <p className="text-xs font-black text-primary truncate">{selectedCourse.nextLesson.title}</p>
        </button>
      )}
      {isLoading ? (
        <SidebarSkeleton />
      ) : sections.length === 0 ? (
        <p className="text-xs font-medium text-foreground/40">{t("studentPages.aiTutor.noLessons")}</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.sectionId}>
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mb-1 px-1">{section.title}</p>
              <ul className="space-y-1">
                {section.lessons.map((lesson) => (
                  <li key={lesson.lessonId}>
                    <LessonButton
                      active={lesson.lessonId === selectedLessonId}
                      completed={Boolean(lesson.completed)}
                      title={lesson.title}
                      onClick={() => onSelectLesson(lesson.lessonId, lesson.title)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SessionPicker({ sessions, isLoading, selectedCourse, selectedLessonId, lessonTitle, onSelectSession, t }: { sessions: CourseDetailSession[]; isLoading: boolean; selectedCourse: StudentPortalCourse | null; selectedLessonId: number | null; lessonTitle: string | null; onSelectSession: (sessionId: number, title: string) => void; t: Translate }) {
  return (
    <>
      {selectedCourse?.nextSession?.sessionTitle && (
        <button onClick={() => onSelectSession(selectedCourse.nextSession!.id ?? 0, selectedCourse.nextSession!.sessionTitle!)} className={`w-full text-left rounded-2xl border-2 px-3 py-2.5 mb-2 transition-all ${lessonTitle === selectedCourse.nextSession.sessionTitle ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/70 mb-0.5">{t("studentPages.aiTutor.nextSession")}</p>
          <p className="text-xs font-black text-primary truncate">{selectedCourse.nextSession.sessionTitle}</p>
        </button>
      )}
      {isLoading ? (
        <SidebarSkeleton />
      ) : sessions.length === 0 ? (
        <p className="text-xs font-medium text-foreground/40">{t("studentPages.aiTutor.noSessions")}</p>
      ) : (
        <ul className="space-y-1">
          {sessions.map((session) => {
            const isSelected = session.id === selectedLessonId;
            const isUpcoming = session.status === "scheduled" || session.status === "upcoming";
            const isDone = session.status === "completed" || session.status === "done";
            const date = formatShortDate(session.startsAt ?? session.startAt);
            return (
              <li key={session.id}>
                <button onClick={() => onSelectSession(session.id, session.sessionTitle)} className={`w-full text-left rounded-xl border-2 px-3 py-2 transition-all text-xs font-bold ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-border hover:bg-muted text-foreground/80"}`}>
                  <div className="flex items-center gap-2">
                    {isDone ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} /> : isUpcoming ? <Clock className={`size-3.5 shrink-0 ${isSelected ? "text-primary" : "text-amber-500"}`} strokeWidth={2.5} /> : <span className={`size-3.5 shrink-0 rounded-full border-2 ${isSelected ? "border-primary" : "border-foreground/30"}`} />}
                    <span className="truncate flex-1">{session.sessionTitle}</span>
                    {session.sessionIndex && <span className="text-[10px] font-black text-foreground/35 shrink-0">#{session.sessionIndex}</span>}
                  </div>
                  {(date || session.location) && (
                    <div className="mt-0.5 ml-5 flex items-center gap-2 text-[10px] font-medium text-foreground/45">
                      {date && <span>{date}</span>}
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
  );
}

function RecentChats({ chats, activeChatId, onResume, onStartNew, t }: { chats: AiChat[]; activeChatId: number | null; onResume: (chat: AiChat) => void; onStartNew: () => void; t: Translate }) {
  return (
    <div className="border-t-2 border-border pt-4 mt-auto">
      <h3 className="font-black text-sm flex items-center gap-2 mb-2">
        <MessageSquare className="size-4 text-primary" /> {t("studentPages.aiTutor.recentChats")}
      </h3>
      <ul className="space-y-1.5">
        {chats.slice(0, 5).map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <li key={chat.id}>
              <button onClick={() => onResume(chat)} className={`w-full text-left rounded-xl border-2 px-3 py-2 transition-all ${isActive ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
                <p className={`text-xs font-black truncate ${isActive ? "text-primary" : ""}`}>{chat.title ?? formatShortDate(chat.createdAt)}</p>
                <p className="text-[10px] font-medium text-foreground/45 mt-0.5">
                  {t("studentPages.aiTutor.messagesCount", { count: chat.messagesCount })}
                  {chat.lastMessageAt ? ` · ${formatShortDate(chat.lastMessageAt)}` : ""}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      {activeChatId && (
        <button onClick={onStartNew} className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-muted px-3 py-2 text-xs font-bold hover:bg-foreground/10 transition-colors">
          <RotateCcw className="size-3.5" /> {t("studentPages.aiTutor.startNewChat")}
        </button>
      )}
    </div>
  );
}

function StarterPanel({ title, subtitle, chips, onSend }: { title: string; subtitle: string; chips: string[]; onSend: (text: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
      <div className="size-14 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow">
        <Bot className="size-7" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-black text-lg">{title}</p>
        <p className="text-sm font-medium text-foreground/55 mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2">
        {chips.map((chip) => (
          <button key={chip} onClick={() => onSend(chip)} className="px-4 py-3 rounded-2xl border-2 border-primary/30 bg-primary/8 text-primary text-xs font-bold hover:bg-primary/15 transition-colors text-left leading-snug">
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function LessonButton({ active, completed, title, onClick }: { active: boolean; completed: boolean; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border-2 px-3 py-2 flex items-center gap-2 transition-all text-xs font-bold ${active ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-border hover:bg-muted text-foreground/80"}`}>
      {completed ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} /> : <span className={`size-3.5 shrink-0 rounded-full border-2 ${active ? "border-primary" : "border-foreground/30"}`} />}
      <span className="truncate">{title}</span>
    </button>
  );
}

function ProgressBar({ value, active = false }: { value: number; active?: boolean }) {
  return (
    <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${active ? "bg-primary" : "bg-foreground/30"}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className={`flex items-end gap-2 ${index % 2 === 0 ? "" : "flex-row-reverse"}`}>
          <div className="size-8 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="h-12 rounded-2xl bg-muted animate-pulse" style={{ width: `${40 + index * 15}%` }} />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return <div className="space-y-1.5">{[0, 1, 2, 3].map((index) => <div key={index} className="h-8 animate-pulse rounded-xl bg-muted" />)}</div>;
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
        <Bot className="size-4" strokeWidth={2.5} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted border-2 border-border flex gap-1">
        <Dot /><Dot delay={150} /><Dot delay={300} />
      </div>
    </div>
  );
}

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
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-background/50 px-1 font-mono text-xs">{part.slice(1, -1)}</code>;
        return part;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s/, ""));
      nodes.push(<ol key={index} className="list-decimal list-inside space-y-0.5 my-1">{items.map((text, itemIndex) => <li key={itemIndex}><MdInline text={text} /></li>)}</ol>);
    } else if (/^[-•]\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-•]\s/.test(lines[index])) items.push(lines[index++].replace(/^[-•]\s/, ""));
      nodes.push(<ul key={index} className="list-disc list-inside space-y-0.5 my-1">{items.map((text, itemIndex) => <li key={itemIndex}><MdInline text={text} /></li>)}</ul>);
    } else {
      nodes.push(<p key={index}><MdInline text={line} /></p>);
      index++;
    }
  }

  return <div className="space-y-1.5">{nodes}</div>;
}

function Dot({ delay = 0 }: { delay?: number }) {
  return <span className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />;
}

type PrototypeMsg = { id: string; role: "user" | "tutor"; text: string };

type PrototypeCourse = { id: number; courseType: "video" | "offline"; title: string; progress: number; next: string };

const MOCK_COURSES: PrototypeCourse[] = [
  { id: 1, courseType: "video", title: "Cognitive Psychology", progress: 45, next: "Working Memory Models" },
  { id: 2, courseType: "video", title: "Organic Chemistry II", progress: 30, next: "Nucleophilic Substitution" },
  { id: 3, courseType: "offline", title: "Math · Grade 10A", progress: 60, next: "Trigonometry Practice" },
];

function PrototypeAiTutorPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<PrototypeMsg[]>([{ id: "0", role: "tutor", text: t("studentPages.aiTutor.prototype.firstMessage") }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCourse = MOCK_COURSES.find((course) => course.id === selectedCourseId) ?? null;
  const chips = selectedCourse ? chipsForContext(t, false, selectedCourse.courseType === "video") : [];

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing || !selectedCourse) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "tutor", text: t("studentPages.aiTutor.prototype.reply") }]);
      setTyping(false);
      inputRef.current?.focus();
    }, 700);
  };

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.aiTutor.title")} subtitle={selectedCourse ? t("studentPages.aiTutor.studying", { context: selectedCourse.title }) : t("studentPages.aiTutor.pickCourseSubtitle")} showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-220px)] min-h-[520px]">
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b-2 border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                <Bot className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black">{t("studentPages.aiTutor.assistantName")}</p>
                <p className="text-[11px] font-bold text-foreground/55 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {selectedCourse?.title ?? t("studentPages.aiTutor.chooseCourse")}
                </p>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!selectedCourse ? (
              <div className="h-full flex flex-col justify-center gap-5 py-6">
                <div className="text-center">
                  <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center border-2 border-foreground chunky-shadow mx-auto mb-3">
                    <Bot className="size-8" strokeWidth={1.5} />
                  </div>
                  <p className="font-black text-xl">{t("studentPages.aiTutor.emptyTitle")}</p>
                  <p className="text-sm font-medium text-foreground/55 mt-1">{t("studentPages.aiTutor.emptyBody")}</p>
                </div>
                <PrototypeCourseGrid courses={MOCK_COURSES} onPick={(id) => setSelectedCourseId(id)} t={t} />
              </div>
            ) : messages.length === 1 ? (
              <StarterPanel
                title={t("studentPages.aiTutor.askAnything", { title: selectedCourse.title })}
                subtitle={selectedCourse.courseType === "video" ? t("studentPages.aiTutor.starterVideo") : t("studentPages.aiTutor.starterSession")}
                chips={chips}
                onSend={send}
              />
            ) : (
              messages.map((message) => <PrototypeBubble key={message.id} msg={message} />)
            )}
            {typing && <TypingBubble />}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="border-t-2 border-border p-3 flex gap-2 bg-background">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={selectedCourse ? t("studentPages.aiTutor.inputPlaceholder") : t("studentPages.aiTutor.selectCoursePlaceholder")}
              disabled={!selectedCourse}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50 disabled:opacity-50"
            />
            <button type="submit" disabled={!input.trim() || typing || !selectedCourse} className="size-12 grid place-items-center rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow disabled:opacity-50">
              {typing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" strokeWidth={2.5} />}
            </button>
          </form>
        </section>

        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow overflow-y-auto">
          <h3 className="font-black text-sm flex items-center gap-2 mb-2">
            <BookOpen className="size-4 text-primary" /> {t("studentPages.aiTutor.yourCourses")}
          </h3>
          <PrototypeCourseGrid courses={MOCK_COURSES} selectedCourseId={selectedCourseId} onPick={(id) => setSelectedCourseId(id)} t={t} />
        </aside>
      </div>
    </DashboardShell>
  );
}

function PrototypeCourseGrid({ courses, selectedCourseId, onPick, t }: { courses: PrototypeCourse[]; selectedCourseId?: number | null; onPick: (id: number) => void; t: Translate }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {courses.map((course) => {
        const active = selectedCourseId === course.id;
        return (
          <button key={course.id} onClick={() => onPick(course.id)} className={`text-left rounded-2xl border-2 p-4 hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all chunky-shadow ${active ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
            <p className="font-black text-sm truncate">{course.title}</p>
            <p className="text-xs font-bold text-primary mt-1 truncate">→ {course.next}</p>
            <ProgressBar value={course.progress} active={active} />
            <p className="text-[10px] font-black text-foreground/40 mt-1">{t("studentPages.aiTutor.progressComplete", { value: course.progress })}</p>
          </button>
        );
      })}
    </div>
  );
}

function PrototypeBubble({ msg }: { msg: PrototypeMsg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
        {isUser ? <User className="size-4" strokeWidth={2.5} /> : <Bot className="size-4" strokeWidth={2.5} />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl border-2 text-sm font-medium leading-relaxed whitespace-pre-wrap ${isUser ? "bg-primary text-primary-foreground border-foreground rounded-br-md chunky-shadow" : "bg-muted border-border rounded-bl-md"}`}>
        {msg.text}
      </div>
    </div>
  );
}
