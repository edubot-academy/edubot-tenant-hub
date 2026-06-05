import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ArrowLeft, BookOpen, Plus, Users, Calendar, X, Trash2, Video, FileText, HelpCircle, ClipboardList, Radio } from "lucide-react";
import {
  useLms,
  coursesForClass,
  assignCourse,
  unassignCourse,
  createCourse,
  courseLessonCount,
  addClassLesson,
  deleteClassLesson,
  type LessonType,
} from "@/lib/lmsStore";

const LESSON_TYPES: { type: LessonType; label: string; icon: typeof Video }[] = [
  { type: "video", label: "Video", icon: Video },
  { type: "reading", label: "Reading", icon: FileText },
  { type: "quiz", label: "Quiz", icon: HelpCircle },
  { type: "assignment", label: "Assignment", icon: ClipboardList },
  { type: "live", label: "Live session", icon: Radio },
];

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({ meta: [{ title: "QuestLMS — Class" }] }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const { classId } = Route.useParams();
  const state = useLms();
  const navigate = useNavigate();
  const coursesEnabled = state.hierarchy.coursesEnabled;
  const klass = state.classes.find((c) => c.id === classId);
  const assigned = useMemo(() => coursesForClass(state, classId), [state, classId]);
  const available = useMemo(
    () => state.courses.filter((c) => !assigned.some((a) => a.id === c.id)),
    [state.courses, assigned],
  );

  const [classLessonOpen, setClassLessonOpen] = useState(false);
  const [classLessonForm, setClassLessonForm] = useState<{ title: string; type: LessonType; durationMin: string }>({
    title: "", type: "video", durationMin: "",
  });

  const submitClassLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classLessonForm.title.trim()) { toast.error("Lesson title is required"); return; }
    addClassLesson(classId, {
      title: classLessonForm.title.trim(),
      type: classLessonForm.type,
      durationMin: classLessonForm.durationMin ? Number(classLessonForm.durationMin) : undefined,
    });
    setClassLessonForm({ title: "", type: "video", durationMin: "" });
    setClassLessonOpen(false);
    toast.success("Lesson added");
  };

  const [assignOpen, setAssignOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string>("");
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", subject: "", description: "" });

  if (!klass) {
    return (
      <DashboardShell>
        <TopBar title="Class not found" showStreak={false} />
        <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to classes
        </Link>
      </DashboardShell>
    );
  }

  const handleAssign = () => {
    if (!pickedId) {
      toast.error("Pick a course to assign");
      return;
    }
    assignCourse(classId, pickedId);
    setAssignOpen(false);
    setPickedId("");
    toast.success("Course assigned to class");
  };

  const handleCreateAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      toast.error("Course title is required");
      return;
    }
    const c = createCourse({
      title: newCourse.title.trim(),
      subject: newCourse.subject.trim() || undefined,
      description: newCourse.description.trim() || undefined,
    });
    assignCourse(classId, c.id);
    setNewCourse({ title: "", subject: "", description: "" });
    setNewCourseOpen(false);
    toast.success(`"${c.title}" created and assigned`);
    navigate({ to: "/courses/$courseId", params: { courseId: c.id } });
  };

  return (
    <DashboardShell>
      <TopBar title={klass.title} subtitle={`${klass.code} · ${klass.students} students`} showStreak={false} />

      <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> All classes
      </Link>

      <div className={`h-32 bg-gradient-to-br ${klass.color} rounded-3xl mb-6 chunky-shadow flex items-end p-5`}>
        <div className="text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{klass.code}</p>
          <h2 className="text-2xl font-black">{klass.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users className="size-4" />} label="Students" value={String(klass.students)} />
        <StatCard icon={<Calendar className="size-4" />} label="Next session" value={klass.nextSession} />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label={coursesEnabled ? "Assigned courses" : "Lessons"}
          value={String(coursesEnabled ? assigned.length : klass.lessons.length)}
        />
      </div>

      {coursesEnabled ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-black">Courses in this class</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewCourseOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted"
              >
                <Plus className="size-3.5" strokeWidth={3} /> New course
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
              >
                <BookOpen className="size-3.5" strokeWidth={3} /> Assign existing
              </button>
            </div>
          </div>

          {assigned.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">No courses assigned yet.</p>
              <p className="text-sm text-foreground/60">Assign one from the library or create a new course for this class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assigned.map((c) => (
                <div key={c.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="flex-1 min-w-0 hover:opacity-80"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{c.subject ?? "Course"}</p>
                      <h4 className="font-black text-base leading-tight">{c.title}</h4>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        unassignCourse(classId, c.id);
                        toast.success("Course removed from class");
                      }}
                      aria-label="Remove course from class"
                      className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {c.description && <p className="text-xs text-foreground/60 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-bold text-foreground/60">{courseLessonCount(c)} lesson{courseLessonCount(c) === 1 ? "" : "s"}</span>
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="text-xs font-black text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-black">Lessons</h3>
            <button
              type="button"
              onClick={() => setClassLessonOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
            >
              <Plus className="size-3.5" strokeWidth={3} /> Add lesson
            </button>
          </div>
          <p className="text-xs text-foreground/60">Courses are disabled for this tenant. Lessons attach directly to the class.</p>
          {klass.lessons.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">No lessons yet.</p>
              <p className="text-sm text-foreground/60">Add your first lesson for this class.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {klass.lessons.map((l, i) => {
                const Icon = LESSON_TYPES.find((t) => t.type === l.type)?.icon ?? FileText;
                return (
                  <li key={l.id} className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl p-3 chunky-shadow">
                    <div className="size-7 grid place-items-center rounded-lg bg-muted text-foreground/70 text-xs font-black">{i + 1}</div>
                    <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{l.title}</p>
                      <p className="text-xs text-foreground/60 capitalize">{l.type}{l.durationMin ? ` · ${l.durationMin} min` : ""}</p>
                    </div>
                    <button type="button" onClick={() => { deleteClassLesson(classId, l.id); toast.success("Lesson removed"); }} aria-label="Delete lesson" className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {classLessonOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setClassLessonOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitClassLesson} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Add lesson</h2>
              <button type="button" onClick={() => setClassLessonOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Title</span>
              <input autoFocus value={classLessonForm.title} onChange={(e) => setClassLessonForm({ ...classLessonForm, title: e.target.value })} placeholder="e.g. Welcome session" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Type</span>
              <div className="grid grid-cols-5 gap-2">
                {LESSON_TYPES.map(({ type, label, icon: Icon }) => (
                  <button key={type} type="button" onClick={() => setClassLessonForm({ ...classLessonForm, type })} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 cursor-pointer transition-colors ${classLessonForm.type === type ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-foreground/70"}`}>
                    <Icon className="size-4" />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Duration (minutes, optional)</span>
              <input type="number" min={0} value={classLessonForm.durationMin} onChange={(e) => setClassLessonForm({ ...classLessonForm, durationMin: e.target.value })} placeholder="15" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setClassLessonOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Add lesson</button>
            </div>
          </form>
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setAssignOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Assign a course</h2>
              <button type="button" onClick={() => setAssignOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            {available.length === 0 ? (
              <p className="text-sm text-foreground/60">All library courses are already assigned to this class.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {available.map((c) => (
                  <label key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer ${pickedId === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                    <input
                      type="radio"
                      name="course"
                      value={c.id}
                      checked={pickedId === c.id}
                      onChange={() => setPickedId(c.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight">{c.title}</p>
                      <p className="text-xs text-foreground/60">{c.subject ?? "—"} · {courseLessonCount(c)} lessons</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
                Cancel
              </button>
              <button type="button" onClick={handleAssign} disabled={!pickedId} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {newCourseOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setNewCourseOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreateAndAssign} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">New course</h2>
              <button type="button" onClick={() => setNewCourseOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <FormField label="Title">
              <input autoFocus value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. Linear Algebra" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <FormField label="Subject">
              <input value={newCourse.subject} onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })} placeholder="e.g. Math" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <FormField label="Description">
              <textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary resize-none" />
            </FormField>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewCourseOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Create & assign</button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <div className="flex items-center gap-2 text-foreground/60 text-xs font-bold uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
