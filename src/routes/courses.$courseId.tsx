import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  ArrowLeft, Plus, X, Video, FileText, HelpCircle, ClipboardList, Radio, Trash2, FolderPlus,
  Sparkles, ClipboardCheck, UserPlus,
} from "lucide-react";
import {
  useLms, addLesson, deleteLesson, addModule, deleteModule, classesForCourse,
  getPlacementTest, enrollmentsForCourse, type LessonType,
} from "@/lib/lmsStore";
import { CurriculumImportDialog } from "@/components/lms/CurriculumImportDialog";
import { PlacementTestDialog } from "@/components/lms/PlacementTestDialog";
import { EnrollIndividualDialog } from "@/components/lms/EnrollIndividualDialog";

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
  const modulesEnabled = state.hierarchy.modulesEnabled;
  const usedIn = course ? classesForCourse(state, courseId) : [];
  const placement = course ? getPlacementTest(state, courseId) : undefined;
  const individualCount = course ? enrollmentsForCourse(state, courseId).filter((e) => !e.classId).length : 0;

  const [lessonModalFor, setLessonModalFor] = useState<{ moduleId?: string } | null>(null);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [form, setForm] = useState<{ title: string; type: LessonType; durationMin: string }>({
    title: "", type: "video", durationMin: "",
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

  const submitLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Lesson title is required"); return; }
    addLesson(courseId, {
      title: form.title.trim(),
      type: form.type,
      durationMin: form.durationMin ? Number(form.durationMin) : undefined,
      moduleId: lessonModalFor?.moduleId,
    });
    setForm({ title: "", type: "video", durationMin: "" });
    setLessonModalFor(null);
    toast.success("Lesson added");
  };

  const submitModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) { toast.error("Module title is required"); return; }
    addModule(courseId, moduleTitle.trim());
    setModuleTitle("");
    setModuleOpen(false);
    toast.success("Module added");
  };

  return (
    <DashboardShell>
      <TopBar title={course.title} subtitle={course.subject ?? "Course template"} showStreak={false} />

      <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Course library
      </Link>

      {course.description && <p className="text-sm text-foreground/70 mb-6 max-w-2xl">{course.description}</p>}

      {usedIn.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Assigned to:</span>
          {usedIn.map((k) => (
            <Link key={k.id} to="/classes/$classId" params={{ classId: k.id }} className="px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold hover:bg-muted">
              {k.title}
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-black">Content</h3>
          <div className="flex gap-2">
            {modulesEnabled && (
              <button type="button" onClick={() => setModuleOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
                <FolderPlus className="size-3.5" strokeWidth={3} /> Add module
              </button>
            )}
            <button type="button" onClick={() => setLessonModalFor({})} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90">
              <Plus className="size-3.5" strokeWidth={3} /> Add lesson
            </button>
          </div>
        </div>

        {modulesEnabled && course.modules.length > 0 && (
          <div className="space-y-4">
            {course.modules.map((m, mi) => (
              <div key={m.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Module {mi + 1}</p>
                    <h4 className="font-black text-base">{m.title}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setLessonModalFor({ moduleId: m.id })} aria-label="Add lesson to module" className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted">
                      <Plus className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => { deleteModule(courseId, m.id); toast.success("Module removed"); }} aria-label="Delete module" className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {m.lessons.length === 0 ? (
                  <p className="text-xs text-foreground/60 italic">No lessons in this module yet.</p>
                ) : (
                  <LessonList lessons={m.lessons} onDelete={(id) => { deleteLesson(courseId, id, m.id); toast.success("Lesson removed"); }} />
                )}
              </div>
            ))}
          </div>
        )}

        {(course.lessons.length > 0 || (!modulesEnabled && course.modules.length === 0)) && (
          <div className="space-y-2">
            {modulesEnabled && course.modules.length > 0 && course.lessons.length > 0 && (
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Ungrouped</p>
            )}
            {course.lessons.length === 0 && course.modules.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
                <p className="font-bold">No content yet</p>
                <p className="text-sm text-foreground/60">{modulesEnabled ? "Add a module or a lesson to get started." : "Add your first lesson."}</p>
              </div>
            ) : (
              <LessonList lessons={course.lessons} onDelete={(id) => { deleteLesson(courseId, id); toast.success("Lesson removed"); }} />
            )}
          </div>
        )}
      </section>

      {lessonModalFor && (
        <Modal onClose={() => setLessonModalFor(null)}>
          <form onSubmit={submitLesson} className="space-y-4">
            <ModalHeader title={lessonModalFor.moduleId ? "Add lesson to module" : "Add lesson"} onClose={() => setLessonModalFor(null)} />
            <Field label="Title">
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1: Intro" className={inputCls} />
            </Field>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Type</span>
              <div className="grid grid-cols-5 gap-2">
                {LESSON_TYPES.map(({ type, label, icon: Icon }) => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 cursor-pointer transition-colors ${form.type === type ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-foreground/70"}`}>
                    <Icon className="size-4" />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Duration (minutes, optional)">
              <input type="number" min={0} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} placeholder="15" className={inputCls} />
            </Field>
            <ModalActions onCancel={() => setLessonModalFor(null)} submitLabel="Add lesson" />
          </form>
        </Modal>
      )}

      {moduleOpen && (
        <Modal onClose={() => setModuleOpen(false)}>
          <form onSubmit={submitModule} className="space-y-4">
            <ModalHeader title="Add module" onClose={() => setModuleOpen(false)} />
            <Field label="Module title">
              <input autoFocus value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="e.g. Unit 1 — Foundations" className={inputCls} />
            </Field>
            <ModalActions onCancel={() => setModuleOpen(false)} submitLabel="Add module" />
          </form>
        </Modal>
      )}
    </DashboardShell>
  );
}

function LessonList({ lessons, onDelete }: { lessons: { id: string; title: string; type: LessonType; durationMin?: number }[]; onDelete: (id: string) => void }) {
  return (
    <ol className="space-y-2">
      {lessons.map((l, i) => {
        const Icon = iconFor(l.type);
        return (
          <li key={l.id} className="flex items-center gap-3 bg-background border-2 border-border rounded-2xl p-3">
            <div className="size-7 grid place-items-center rounded-lg bg-muted text-foreground/70 text-xs font-black">{i + 1}</div>
            <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{l.title}</p>
              <p className="text-xs text-foreground/60 capitalize">{l.type}{l.durationMin ? ` · ${l.durationMin} min` : ""}</p>
            </div>
            <button type="button" onClick={() => onDelete(l.id)} aria-label="Delete lesson" className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary";

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black">{title}</h2>
      <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button>
    </div>
  );
}
function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
      <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">{submitLabel}</button>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
