import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Sparkles, Bold, Italic, List, Heading1, Heading2, Link as LinkIcon,
  Image as ImageIcon, Video, FileText, Plus, GripVertical, Save, Eye,
  Wand2, Loader2, ChevronDown, ChevronRight, BookOpen, Users, Calendar,
  MapPin, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import {
  useInstructorCourses,
  useTenantCourseSections,
  useUpdateTenantLesson,
  useCourseGroupsByCourse,
  useCourseGroupSessions,
  useCreateCourseSession,
  type TenantLessonRecord,
  type TenantSectionRecord,
  type TenantCourseGroupRecord,
  type CourseSessionRecord,
} from "@/lib/lms-core-api";
import { useGenerateFreeFormContent } from "@/lib/ai-tutor-api";

export const Route = createFileRoute("/course-studio")({
  head: () => ({ meta: [{ title: "QuestLMS — Course Studio" }] }),
  validateSearch: z.object({
    courseId: z.coerce.number().optional(),
    lessonId: z.coerce.number().optional(),
  }),
  component: CourseStudioPage,
});

// ─── Block model + content serialization ─────────────────────────────────────

type BlockType = "h1" | "h2" | "p" | "list" | "video" | "quiz";
type Block = { id: string; type: BlockType; content: string };

function contentToBlocks(content: string | null | undefined): Block[] {
  if (!content?.trim()) return [];
  return content.split(/\n\n+/).filter(Boolean).map((chunk) => {
    const id = crypto.randomUUID();
    if (chunk.startsWith("# ")) return { id, type: "h1", content: chunk.slice(2).trim() };
    if (chunk.startsWith("## ")) return { id, type: "h2", content: chunk.slice(3).trim() };
    if (chunk.startsWith("- ") || chunk.match(/^[-*] /m)) {
      return { id, type: "list", content: chunk.split("\n").map((l) => l.replace(/^[-*] /, "")).join("\n") };
    }
    if (chunk.startsWith("[video:")) return { id, type: "video", content: chunk.slice(8, -1).trim() };
    if (chunk.startsWith("[quiz:")) return { id, type: "quiz", content: chunk.slice(7, -1).trim() };
    return { id, type: "p", content: chunk };
  });
}

function blocksToContent(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "h1") return `# ${b.content}`;
      if (b.type === "h2") return `## ${b.content}`;
      if (b.type === "list")
        return b.content
          .split("\n")
          .map((l) => `- ${l}`)
          .join("\n");
      if (b.type === "video") return `[video: ${b.content}]`;
      if (b.type === "quiz") return `[quiz: ${b.content}]`;
      return b.content;
    })
    .join("\n\n");
}

// ─── Prototype page ───────────────────────────────────────────────────────────

const PROTO_LESSONS = [
  { id: "l1", title: "Intro to Memory", state: "Published" },
  { id: "l2", title: "Sensory Memory", state: "Published" },
  { id: "l3", title: "Working Memory", state: "Editing" },
  { id: "l4", title: "Long-Term Memory", state: "Draft" },
];

const PROTO_BLOCKS: Block[] = [
  { id: "b1", type: "h1", content: "Module 3 — Working Memory" },
  { id: "b2", type: "p", content: "Working memory holds and manipulates information across short timescales. In this module we'll explore Baddeley's model, capacity limits, and rehearsal strategies." },
  { id: "b3", type: "h2", content: "Learning objectives" },
  { id: "b4", type: "list", content: "Define working memory\nContrast with short-term memory\nApply chunking to improve recall" },
  { id: "b5", type: "video", content: "Lecture: The Phonological Loop (12m)" },
];

function PrototypeCourseStudioPage() {
  const [blocks, setBlocks] = useState<Block[]>(PROTO_BLOCKS);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setBlocks((b) => [
        ...b,
        { id: crypto.randomUUID(), type: "h2", content: `AI: ${prompt}` },
        { id: crypto.randomUUID(), type: "p", content: "Generated explanation appears here with clear examples and a closing summary tailored to your learners." },
        { id: crypto.randomUUID(), type: "list", content: "Key point one\nKey point two\nKey point three" },
      ]);
      setPrompt("");
      setGenerating(false);
    }, 900);
  };

  return (
    <DashboardShell>
      <TopBar title="Course Studio" subtitle="Author rich lessons with an AI co-writer." showStreak={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3">Lessons</h3>
          <ul className="space-y-1.5">
            {PROTO_LESSONS.map((l, i) => (
              <li key={l.id}
                className={`p-3 rounded-xl border-2 ${i === 2 ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"} cursor-pointer transition-colors`}>
                <p className="font-bold text-sm truncate">{l.title}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mt-1">{l.state}</p>
              </li>
            ))}
          </ul>
          <button className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-border font-bold text-sm hover:bg-muted transition-colors">
            <Plus className="size-4" strokeWidth={3} /> New lesson
          </button>
        </aside>

        <StudioEditor
          blocks={blocks}
          onBlocksChange={setBlocks}
          saving={false}
          dirty={false}
          onSave={() => {}}
        />

        <AiPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          generating={generating}
          onGenerate={generate}
          onQuickAction={setPrompt}
          aiResult={null}
          onInsertResult={() => {}}
          onDiscardResult={() => {}}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendCourseStudioPage() {
  const navigate = useNavigate({ from: "/course-studio" });
  const { courseId: paramCourseId, lessonId: paramLessonId } = Route.useSearch();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(paramCourseId ?? null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<CourseSessionRecord | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<(TenantLessonRecord & { sectionId: number }) | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dirty, setDirty] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);

  const coursesQuery = useInstructorCourses();
  const updateLesson = useUpdateTenantLesson();
  const aiGenerate = useGenerateFreeFormContent();
  const createSession = useCreateCourseSession();

  const courses = coursesQuery.data?.items ?? [];
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const isGroupCourse = selectedCourse != null && selectedCourse.courseType != null && selectedCourse.courseType !== "video";

  const groupsQuery = useCourseGroupsByCourse(isGroupCourse ? selectedCourseId : null);
  const sessionsQuery = useCourseGroupSessions(isGroupCourse && selectedGroupId ? selectedGroupId : null);

  const sectionsQuery = useTenantCourseSections(isGroupCourse ? null : selectedCourseId);
  const sections: TenantSectionRecord[] = sectionsQuery.data ?? [];

  // Auto-select course from URL
  useEffect(() => {
    if (paramCourseId && selectedCourseId !== paramCourseId) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId, selectedCourseId]);

  // Auto-open all sections and select lesson from URL when sections load
  useEffect(() => {
    if (!sections.length) return;
    const allIds = new Set(sections.map((s) => s.id));
    setExpandedSections(allIds);
    if (paramLessonId && !selectedLesson) {
      for (const section of sections) {
        const lesson = section.lessons?.find((l) => l.id === paramLessonId);
        if (lesson) { selectLesson({ ...lesson, sectionId: section.id }); break; }
      }
    }
  // selectLesson is defined below and stable within the render; sections identity is stable from query cache
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length, paramLessonId, selectedLesson]);

  function selectLesson(lesson: TenantLessonRecord & { sectionId: number }) {
    setSelectedLesson(lesson);
    setBlocks(contentToBlocks(lesson.content));
    setDirty(false);
    navigate({ search: (prev) => ({ ...prev, courseId: selectedCourseId ?? undefined, lessonId: lesson.id }) });
  }

  function selectCourse(id: number) {
    setSelectedCourseId(id);
    setSelectedGroupId(null);
    setSelectedSession(null);
    setSelectedLesson(null);
    setBlocks([]);
    setDirty(false);
    setExpandedSections(new Set());
    setShowNewSession(false);
    setAiResult(null);
    navigate({ search: { courseId: id } });
  }

  const handleSave = async () => {
    if (!selectedLesson || !selectedCourseId) return;
    const content = blocksToContent(blocks);
    try {
      await updateLesson.mutateAsync({
        courseId: selectedCourseId,
        sectionId: selectedLesson.sectionId,
        lessonId: selectedLesson.id,
        patch: { content },
      });
      setDirty(false);
      toast.success("Lesson saved.");
    } catch {
      toast.error("Failed to save lesson.");
    }
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setAiResult(null);
    try {
      const result = await aiGenerate.mutateAsync({ mode: "outline", topic: prompt });
      if (!result.content?.trim()) {
        toast.error("AI returned no content. Check your AI provider configuration.");
        return;
      }
      setAiResult(result.content);
      setPrompt("");
    } catch {
      toast.error("AI generation failed.");
    }
  };

  const handleInsertAiResult = () => {
    if (!aiResult) return;
    const newBlocks: Block[] = aiResult
      .split(/\n\n+/)
      .filter(Boolean)
      .map((chunk) => {
        const id = crypto.randomUUID();
        if (chunk.startsWith("# ")) return { id, type: "h1" as const, content: chunk.slice(2).trim() };
        if (chunk.startsWith("## ")) return { id, type: "h2" as const, content: chunk.slice(3).trim() };
        if (chunk.match(/^[-*] /m)) return { id, type: "list" as const, content: chunk.split("\n").map((l) => l.replace(/^[-*] /, "")).join("\n") };
        return { id, type: "p" as const, content: chunk };
      });
    setBlocks((b) => [...b, ...newBlocks]);
    setDirty(true);
    setAiResult(null);
  };

  const toggleSection = (id: number) =>
    setExpandedSections((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <DashboardShell>
      <TopBar
        title="Course Studio"
        subtitle={selectedLesson ? selectedLesson.title : "Select a lesson to start editing"}
        showStreak={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5">
        {/* ── Left sidebar ── */}
        <aside className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden h-fit">
          {/* Course picker */}
          <div className="p-3 border-b-2 border-border">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">Course</p>
            {coursesQuery.isLoading ? (
              <div className="h-9 bg-muted rounded-xl animate-pulse" />
            ) : coursesQuery.isError ? (
              <p className="text-xs font-bold text-destructive">Failed to load courses.</p>
            ) : courses.length === 0 ? (
              <p className="text-xs font-medium text-foreground/50">No courses assigned yet.</p>
            ) : (
              <select
                value={selectedCourseId ?? ""}
                onChange={(e) => e.target.value && selectCourse(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50"
              >
                <option value="">— Pick a course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.courseType && c.courseType !== "video" ? ` (${c.courseType})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sections + lessons */}
          {selectedCourseId && (
            <div className="max-h-[60vh] overflow-y-auto">
              {isGroupCourse ? (
                <GroupSessionPanel
                  courseType={selectedCourse?.courseType ?? "offline"}
                  courseId={selectedCourseId!}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={(id) => { setSelectedGroupId(id); setSelectedSession(null); }}
                  selectedSession={selectedSession}
                  onSelectSession={setSelectedSession}
                  groupsQuery={groupsQuery}
                  sessionsQuery={sessionsQuery}
                  showNewSession={showNewSession}
                  onToggleNewSession={() => setShowNewSession((v) => !v)}
                  createSession={createSession}
                />
              ) : sectionsQuery.isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" />)}
                </div>
              ) : sections.length === 0 ? (
                <p className="p-4 text-xs font-medium text-foreground/50">No sections yet.</p>
              ) : (
                sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/60 transition-colors border-b border-border/50"
                    >
                      {expandedSections.has(section.id)
                        ? <ChevronDown className="size-3.5 text-foreground/50 shrink-0" strokeWidth={2.5} />
                        : <ChevronRight className="size-3.5 text-foreground/50 shrink-0" strokeWidth={2.5} />}
                      <span className="font-black text-xs truncate flex-1 text-left">{section.title}</span>
                      <span className="text-[10px] text-foreground/40 font-bold">{section.lessons?.length ?? 0}</span>
                    </button>
                    {expandedSections.has(section.id) && (section.lessons ?? []).map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson({ ...lesson, sectionId: section.id })}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-muted/60 border-b border-border/30 ${
                          selectedLesson?.id === lesson.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                        }`}
                      >
                        <BookOpen className="size-3 text-foreground/40 shrink-0" strokeWidth={2.5} />
                        <span className="text-xs font-bold truncate flex-1">{lesson.title}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                          lesson.isPublished ? "bg-primary/20 text-primary" : "bg-muted text-foreground/40"
                        }`}>
                          {lesson.isPublished ? "live" : "draft"}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* ── Editor / Session detail ── */}
        {isGroupCourse ? (
          selectedSession ? (
            <SessionDetailPanel session={selectedSession} />
          ) : (
            <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10 min-h-[400px]">
              <div className="space-y-2 max-w-xs">
                <Calendar className="size-12 mx-auto text-foreground/25" strokeWidth={1.5} />
                <p className="font-black text-lg">Select a session</p>
                <p className="text-sm font-medium text-foreground/55">
                  Pick a group and session from the sidebar to view details.
                </p>
              </div>
            </div>
          )
        ) : selectedLesson ? (
          <StudioEditor
            blocks={blocks}
            onBlocksChange={(b) => { setBlocks(b); setDirty(true); }}
            saving={updateLesson.isPending}
            dirty={dirty}
            onSave={handleSave}
            lessonTitle={selectedLesson.title}
            lessonKind={selectedLesson.kind as string | undefined}
          />
        ) : (
          <div className="bg-card border-2 border-border rounded-3xl chunky-shadow grid place-items-center text-center p-10 min-h-[400px]">
            <div className="space-y-2 max-w-xs">
              <BookOpen className="size-12 mx-auto text-foreground/25" strokeWidth={1.5} />
              <p className="font-black text-lg">Select a lesson</p>
              <p className="text-sm font-medium text-foreground/55">
                Pick a course and lesson from the sidebar to start editing content.
              </p>
            </div>
          </div>
        )}

        {/* ── AI panel ── */}
        <AiPanel
          prompt={prompt}
          onPromptChange={(p) => { setPrompt(p); setAiResult(null); }}
          generating={aiGenerate.isPending}
          onGenerate={handleAiGenerate}
          onQuickAction={(s) => { setAiResult(null); setPrompt(s); }}
          aiResult={aiResult}
          onInsertResult={handleInsertAiResult}
          onDiscardResult={() => setAiResult(null)}
          mode={isGroupCourse ? "session" : "lesson"}
          disabled={isGroupCourse ? !selectedSession : !selectedLesson}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Group / Session panel (offline + online_live courses) ───────────────────

function GroupSessionPanel({
  courseType,
  courseId: _courseId,
  selectedGroupId,
  onSelectGroup,
  selectedSession,
  onSelectSession,
  groupsQuery,
  sessionsQuery,
  showNewSession,
  onToggleNewSession,
  createSession,
}: {
  courseType: string;
  courseId: number;
  selectedGroupId: number | null;
  onSelectGroup: (id: number | null) => void;
  selectedSession: CourseSessionRecord | null;
  onSelectSession: (s: CourseSessionRecord) => void;
  groupsQuery: ReturnType<typeof useCourseGroupsByCourse>;
  sessionsQuery: ReturnType<typeof useCourseGroupSessions>;
  showNewSession: boolean;
  onToggleNewSession: () => void;
  createSession: ReturnType<typeof useCreateCourseSession>;
}) {
  const groups: TenantCourseGroupRecord[] = groupsQuery.data ?? [];
  const sessions = [...(sessionsQuery.data ?? [])].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const isLive = courseType === "online_live";

  const [form, setForm] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    location: "",
    liveJoinUrl: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !form.title || !form.startsAt || !form.endsAt) return;
    const nextIndex = sessions.length + 1;
    await createSession.mutateAsync({
      groupId: selectedGroupId,
      sessionIndex: nextIndex,
      title: form.title,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      location: form.location || undefined,
      liveJoinUrl: form.liveJoinUrl || undefined,
    });
    setForm({ title: "", startsAt: "", endsAt: "", location: "", liveJoinUrl: "" });
    onToggleNewSession();
  };

  return (
    <div className="p-3 space-y-3">
      {/* Group picker */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">Group</p>
        {groupsQuery.isLoading ? (
          <div className="h-8 bg-muted rounded-lg animate-pulse" />
        ) : groups.length === 0 ? (
          <p className="text-xs text-foreground/45">No groups yet.</p>
        ) : (
          <select
            value={selectedGroupId ?? ""}
            onChange={(e) => onSelectGroup(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-2 py-1.5 rounded-lg bg-muted border-2 border-border text-xs font-bold focus:outline-none focus:border-primary/50"
          >
            <option value="">— Pick a group —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sessions list */}
      {selectedGroupId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Sessions</p>
            <button
              onClick={onToggleNewSession}
              className="inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
            >
              {showNewSession ? <X className="size-3" /> : <Plus className="size-3" strokeWidth={3} />}
              {showNewSession ? "Cancel" : "New"}
            </button>
          </div>

          {/* New session form */}
          {showNewSession && (
            <form onSubmit={handleCreate} className="space-y-2 p-3 bg-muted/50 rounded-xl border-2 border-border">
              <input
                required
                placeholder="Session title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-background border-2 border-border focus:outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-foreground/40 mb-1">Starts</p>
                  <input
                    required
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-background border-2 border-border focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-foreground/40 mb-1">Ends</p>
                  <input
                    required
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-background border-2 border-border focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {isLive ? (
                <input
                  placeholder="Live join URL"
                  type="url"
                  value={form.liveJoinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, liveJoinUrl: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-background border-2 border-border focus:outline-none focus:border-primary"
                />
              ) : (
                <input
                  placeholder="Location (optional)"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-background border-2 border-border focus:outline-none focus:border-primary"
                />
              )}
              <button
                type="submit"
                disabled={createSession.isPending}
                className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
              >
                {createSession.isPending ? "Creating…" : "Create session"}
              </button>
            </form>
          )}

          {/* Sessions */}
          {sessionsQuery.isLoading ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-foreground/40 font-medium">No sessions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {sessions.map((s) => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s)}
                    className={`w-full text-left p-2.5 rounded-xl border-2 transition-colors space-y-1 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold leading-tight flex-1">{s.title}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                        s.status === "completed" ? "bg-primary/20 text-primary" :
                        s.status === "cancelled" ? "bg-destructive/15 text-destructive" :
                        "bg-muted text-foreground/50"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-foreground/50 font-medium">
                      <Calendar className="size-3 shrink-0" />
                      <span>{new Date(s.startsAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                    {s.location && (
                      <div className="flex items-center gap-2 text-[10px] text-foreground/50 font-medium">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Session detail panel ─────────────────────────────────────────────────────

function SessionDetailPanel({ session }: { session: CourseSessionRecord }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const durationMin = Math.round(
    (new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 60000,
  );

  return (
    <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col min-h-[400px]">
      {/* Header */}
      <div className="p-6 border-b-2 border-border space-y-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Session #{session.sessionIndex}</p>
        <h2 className="text-2xl font-black">{session.title}</h2>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/60">
            <Calendar className="size-4 shrink-0" />
            <span>{fmt(session.startsAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/60">
            <span className="text-foreground/30">→</span>
            <span>{fmt(session.endsAt)}</span>
          </div>
          {durationMin > 0 && (
            <span className="text-xs font-bold bg-muted px-2 py-1 rounded-lg text-foreground/50">
              {durationMin} min
            </span>
          )}
          <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${
            session.status === "completed" ? "bg-primary/15 text-primary" :
            session.status === "cancelled" ? "bg-destructive/15 text-destructive" :
            "bg-muted text-foreground/50"
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-6 space-y-4 flex-1">
        {(session.location || session.liveJoinUrl) && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl border-2 border-border">
            <MapPin className="size-4 shrink-0 text-foreground/40 mt-0.5" />
            {session.liveJoinUrl ? (
              <a
                href={session.liveJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-primary hover:underline break-all"
              >
                {session.liveJoinUrl}
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground/70">{session.location}</span>
            )}
          </div>
        )}

        {/* Activities */}
        {session.activities && session.activities.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Activities</p>
            {session.activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                <span className="text-sm font-bold">{a.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-foreground/40">{a.type}</span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    a.status === "graded" ? "bg-primary/20 text-primary" : "bg-muted text-foreground/40"
                  }`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {session.recordingUrl && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border-2 border-border">
            <Video className="size-4 shrink-0 text-foreground/40" />
            <a
              href={session.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary hover:underline break-all"
            >
              View recording
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StudioEditor({
  blocks,
  onBlocksChange,
  saving,
  dirty,
  onSave,
  lessonTitle,
  lessonKind,
}: {
  blocks: Block[];
  onBlocksChange: (b: Block[]) => void;
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  lessonTitle?: string;
  lessonKind?: string;
}) {
  const addBlock = (type: BlockType) =>
    onBlocksChange([...blocks, { id: crypto.randomUUID(), type, content: "" }]);

  return (
    <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b-2 border-border bg-muted/40 flex-wrap">
        {([Bold, Italic, Heading1, Heading2, List, LinkIcon, ImageIcon, Video, FileText] as const).map((Icon, i) => (
          <button key={i} className="size-9 grid place-items-center rounded-lg hover:bg-background transition-colors" aria-label="format">
            <Icon className="size-4" />
          </button>
        ))}
        <div className="flex-1" />
        {lessonKind && (
          <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-black uppercase tracking-wider text-foreground/50">
            {lessonKind}
          </span>
        )}
        <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
          <Eye className="size-3.5" /> Preview
        </button>
        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs disabled:opacity-50 transition-opacity"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Lesson title (read-only label) */}
      {lessonTitle && (
        <div className="px-6 pt-4 pb-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mb-1">Lesson</p>
          <p className="font-black text-lg text-foreground/80">{lessonTitle}</p>
        </div>
      )}

      {/* Block area */}
      <div className="flex-1 p-6 space-y-3 max-h-[64vh] overflow-y-auto">
        {blocks.length === 0 && (
          <p className="text-sm text-foreground/40 font-medium italic">Start writing or use the AI co-writer →</p>
        )}
        {blocks.map((b) => (
          <div key={b.id} className="group flex gap-2 items-start">
            <button className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 text-foreground/40 shrink-0" aria-label="drag">
              <GripVertical className="size-4" />
            </button>
            <BlockEditor
              block={b}
              onChange={(content) =>
                onBlocksChange(blocks.map((x) => (x.id === b.id ? { ...x, content } : x)))
              }
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-dashed border-border">
          {(["h2", "p", "list", "video", "quiz"] as const).map((t) => (
            <button key={t} onClick={() => addBlock(t)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-border hover:bg-muted font-bold text-xs uppercase tracking-wider transition-colors">
              <Plus className="size-3" strokeWidth={3} /> {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const LESSON_QUICK_ACTIONS = [
  "Summarize this lesson",
  "Suggest 5 quiz questions",
  "Add a worked example",
  "Rewrite simpler",
];

const SESSION_QUICK_ACTIONS = [
  "Generate a session agenda",
  "Write a warm-up activity",
  "Suggest 3 discussion questions",
  "Create a quick exit ticket",
];

function AiPanel({
  prompt,
  onPromptChange,
  generating,
  onGenerate,
  onQuickAction,
  aiResult,
  onInsertResult,
  onDiscardResult,
  mode = "lesson",
  disabled = false,
}: {
  prompt: string;
  onPromptChange: (s: string) => void;
  generating: boolean;
  onGenerate: () => void;
  onQuickAction: (s: string) => void;
  aiResult: string | null;
  onInsertResult: () => void;
  onDiscardResult: () => void;
  mode?: "lesson" | "session";
  disabled?: boolean;
}) {
  const isSession = mode === "session";
  const placeholder = isSession
    ? "Draft an agenda for a 90-min intro session on fractions"
    : "Explain chunking with two examples for Year-9 students";
  const disabledHint = isSession
    ? "Select a session to enable AI assistance."
    : "Select a lesson to enable AI assistance.";
  const quickActions = isSession ? SESSION_QUICK_ACTIONS : LESSON_QUICK_ACTIONS;

  const handleCopy = () => {
    if (aiResult) navigator.clipboard.writeText(aiResult).then(() => toast.success("Copied!"));
  };

  return (
    <aside className={`bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit space-y-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <h3 className="font-black flex items-center gap-2">
        <Sparkles className="size-4 text-primary" strokeWidth={2.5} /> AI co-writer
      </h3>

      {disabled && (
        <p className="text-xs text-foreground/50 font-medium">{disabledHint}</p>
      )}

      {!disabled && aiResult ? (
        /* ── Result preview ── */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Generated</p>
            <button onClick={onDiscardResult} className="text-[10px] font-bold text-foreground/40 hover:text-destructive transition-colors flex items-center gap-1">
              <X className="size-3" /> Discard
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto p-3 bg-muted/50 rounded-xl border-2 border-border text-xs font-medium leading-relaxed whitespace-pre-wrap text-foreground/80">
            {aiResult}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 rounded-xl border-2 border-border font-bold text-xs hover:bg-muted transition-colors"
            >
              Copy
            </button>
            {!isSession && (
              <button
                onClick={onInsertResult}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Insert into editor
              </button>
            )}
          </div>
          <button
            onClick={onDiscardResult}
            className="w-full text-xs font-bold text-foreground/50 hover:text-foreground/80 transition-colors"
          >
            ← Write another prompt
          </button>
        </div>
      ) : !disabled && (
        /* ── Prompt input ── */
        <>
          <p className="text-xs text-foreground/60 font-medium">
            {isSession
              ? "Describe what to plan. I'll draft materials you can use or adapt."
              : "Describe what to add. I'll draft a section you can keep, edit, or discard."}
          </p>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholder}
            rows={5}
            className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
          />
          <button
            onClick={onGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-50 transition-opacity"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" strokeWidth={2.5} />}
            {generating ? "Drafting…" : isSession ? "Generate plan" : "Generate section"}
          </button>
          <div className="space-y-2 pt-2 border-t-2 border-border">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Quick actions</p>
            {quickActions.map((s) => (
              <button key={s} onClick={() => onQuickAction(s)}
                className="w-full text-left p-2.5 rounded-lg bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (s: string) => void }) {
  const base = "w-full bg-transparent outline-none font-medium resize-none";
  if (block.type === "h1")
    return <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Title…"
      className={`${base} text-3xl font-black`} />;
  if (block.type === "h2")
    return <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Heading…"
      className={`${base} text-xl font-black`} />;
  if (block.type === "list")
    return <textarea value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="One item per line…"
      rows={Math.max(3, block.content.split("\n").length)} className={`${base} text-sm leading-relaxed pl-5`} />;
  if (block.type === "video")
    return <div className="w-full p-4 bg-muted border-2 border-dashed border-border rounded-xl flex items-center gap-3">
      <Video className="size-5 text-primary" />
      <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Video URL or title…"
        className={`${base} text-sm`} />
    </div>;
  if (block.type === "quiz")
    return <div className="w-full p-4 bg-accent/10 border-2 border-dashed border-accent rounded-xl flex items-center gap-3">
      <FileText className="size-5 text-accent-foreground" />
      <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Quiz title to embed…"
        className={`${base} text-sm`} />
    </div>;
  return <textarea value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Write…"
    rows={Math.max(2, Math.ceil(block.content.length / 70))} className={`${base} text-base leading-relaxed`} />;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function CourseStudioPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendCourseStudioPage /> : <PrototypeCourseStudioPage />;
}
