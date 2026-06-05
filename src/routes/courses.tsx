import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, BookOpen, X, ArrowLeft } from "lucide-react";
import { useLms, createCourse, classesForCourse, courseLessonCount } from "@/lib/lmsStore";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "QuestLMS — Course Library" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const state = useLms();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const c = createCourse({
      title: form.title.trim(),
      subject: form.subject.trim() || undefined,
      description: form.description.trim() || undefined,
    });
    setForm({ title: "", subject: "", description: "" });
    setOpen(false);
    toast.success(`Course "${c.title}" created`);
  };

  return (
    <DashboardShell>
      <TopBar title="Course Library" subtitle="Reusable course templates. Assign any course to one or more classes." showStreak={false} />

      <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to classes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60 font-medium">{state.courses.length} courses</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" strokeWidth={3} /> New course
        </button>
      </div>

      {state.courses.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-2">
          <BookOpen className="size-8 mx-auto text-foreground/40" />
          <p className="font-bold">No courses yet</p>
          <p className="text-sm text-foreground/60">Create your first course template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.courses.map((c) => {
            const classes = classesForCourse(state, c.id);
            return (
              <Link
                key={c.id}
                to="/courses/$courseId"
                params={{ courseId: c.id }}
                className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow hover:border-foreground/20 transition-colors space-y-3"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{c.subject ?? "Course"}</p>
                <h3 className="font-black text-base leading-tight">{c.title}</h3>
                {c.description && <p className="text-xs text-foreground/60 line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs font-bold text-foreground/60">
                  <span>{courseLessonCount(c)} lesson{courseLessonCount(c) === 1 ? "" : "s"}</span>
                  <span>{classes.length} class{classes.length === 1 ? "" : "es"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">New course</h2>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Title</span>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Linear Algebra" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Subject</span>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Math" className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary resize-none" />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Create course</button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
