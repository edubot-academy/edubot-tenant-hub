import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  ArrowLeft,
  Plus,
  X,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Radio,
  Trash2,
} from "lucide-react";
import {
  useLms,
  addLesson,
  deleteLesson,
  classesForCourse,
  type LessonType,
} from "@/lib/lmsStore";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: "QuestLMS — Course" }] }),
  component: CourseDetailPage,
});

const LESSON_TYPES: { type: LessonType; label: string; icon: typeof Video }[] = [
  { type: "video", label: "Video", icon: Video },
  { type: "reading", label: "Reading", icon: FileText },
  { type: "quiz", label: "Quiz", icon: HelpCircle },
  { type: "assignment", label: "Assignment", icon: ClipboardList },
  { type: "live", label: "Live session", icon: Radio },
];

function iconFor(type: LessonType) {
  return LESSON_TYPES.find((l) => l.type === type)?.icon ?? FileText;
}

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const state = useLms();
  const course = state.courses.find((c) => c.id === courseId);
  const usedIn = course ? classesForCourse(state, courseId) : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; type: LessonType; durationMin: string }>({
    title: "",
    type: "video",
    durationMin: "",
  });

  if (!course) {
    return (
      <DashboardShell>
        <TopBar title="Course not found" showStreak={false} />
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to library
        </Link>
      </DashboardShell>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    addLesson(courseId, {
      title: form.title.trim(),
      type: form.type,
      durationMin: form.durationMin ? Number(form.durationMin) : undefined,
    });
    setForm({ title: "", type: "video", durationMin: "" });
    setOpen(false);
    toast.success("Lesson added");
  };

  return (
    <DashboardShell>
      <TopBar title={course.title} subtitle={course.subject ?? "Course template"} showStreak={false} />

      <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Course library
      </Link>

      {course.description && (
        <p className="text-sm text-foreground/70 mb-6 max-w-2xl">{course.description}</p>
      )}

      {usedIn.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Assigned to:</span>
          {usedIn.map((k) => (
            <Link
              key={k.id}
              to="/classes/$classId"
              params={{ classId: k.id }}
              className="px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold hover:bg-muted"
            >
              {k.title}
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">Lessons</h3>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={3} /> Add lesson
          </button>
        </div>

        {course.lessons.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
            <p className="font-bold">No lessons yet</p>
            <p className="text-sm text-foreground/60">Add your first lesson to start building this course.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {course.lessons.map((l, i) => {
              const Icon = iconFor(l.type);
              return (
                <li key={l.id} className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
                  <div className="size-8 grid place-items-center rounded-lg bg-muted text-foreground/70 text-xs font-black">
                    {i + 1}
                  </div>
                  <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{l.title}</p>
                    <p className="text-xs text-foreground/60 capitalize">
                      {l.type}{l.durationMin ? ` · ${l.durationMin} min` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteLesson(courseId, l.id);
                      toast.success("Lesson removed");
                    }}
                    aria-label="Delete lesson"
                    className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Add lesson</h2>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Title</span>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1: Intro" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Type</span>
              <div className="grid grid-cols-5 gap-2">
                {LESSON_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 cursor-pointer transition-colors ${form.type === type ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-foreground/70"}`}
                  >
                    <Icon className="size-4" />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Duration (minutes, optional)</span>
              <input type="number" min={0} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} placeholder="15" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Add lesson</button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
