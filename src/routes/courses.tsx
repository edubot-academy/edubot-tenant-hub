import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, BookOpen, X, ArrowLeft } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useCreateTenantCourse, useTenantCourseGroups, useTenantCourses } from "@/lib/lms-core-api";
import { useLms, createCourse, classesForCourse, courseLessonCount } from "@/lib/lmsStore";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "QuestLMS — Course Library" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const state = useLms();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const coursesQuery = useTenantCourses();
  const groupsQuery = useTenantCourseGroups();
  const createTenantCourse = useCreateTenantCourse();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "" });

  const backendCourses = coursesQuery.data?.items ?? [];
  const backendGroups = groupsQuery.data ?? [];
  const totalCourses = backendEnabled ? coursesQuery.data?.total ?? backendCourses.length : state.courses.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (backendEnabled && form.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (backendEnabled) {
      try {
        const created = await createTenantCourse.mutateAsync({
          title: form.title.trim(),
          subtitle: form.subject.trim() || undefined,
          description: form.description.trim(),
        });
        setForm({ title: "", subject: "", description: "" });
        setOpen(false);
        toast.success(`Course "${created.title}" created`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create course");
      }
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
        <p className="text-sm text-foreground/60 font-medium">{totalCourses} courses</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" strokeWidth={3} /> New course
        </button>
      </div>

      {backendEnabled && coursesQuery.isLoading ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-2">
          <p className="font-bold">Loading courses...</p>
        </div>
      ) : backendEnabled && coursesQuery.isError ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-12 text-center space-y-2">
          <p className="font-bold text-destructive">Could not load courses</p>
          <p className="text-sm text-foreground/60">Backend mode is enabled, but the course library request failed.</p>
        </div>
      ) : (backendEnabled ? backendCourses.length === 0 : state.courses.length === 0) ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-2">
          <BookOpen className="size-8 mx-auto text-foreground/40" />
          <p className="font-bold">No courses yet</p>
          <p className="text-sm text-foreground/60">Create your first course template.</p>
        </div>
      ) : backendEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {backendCourses.map((course) => {
            const classes = backendGroups.filter((group) => group.courseId === course.id);
            const lessonCount = course.lessonCount ?? 0;
            const subject = course.category?.title ?? course.category?.name ?? course.subtitle ?? "Course";
            return (
              <Link
                key={course.id}
                to="/courses/$courseId"
                params={{ courseId: String(course.id) }}
                className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow hover:border-foreground/20 transition-colors space-y-3"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{subject}</p>
                <h3 className="font-black text-base leading-tight">{course.title}</h3>
                {course.description && <p className="text-xs text-foreground/60 line-clamp-2">{course.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs font-bold text-foreground/60">
                  <span>{lessonCount} lesson{lessonCount === 1 ? "" : "s"}</span>
                  <span>{classes.length} class{classes.length === 1 ? "" : "es"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.courses.map((c) => {
            const classes = classesForCourse(state, c.id);
            const lessonCount = courseLessonCount(c);
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
                  <span>{lessonCount} lesson{lessonCount === 1 ? "" : "s"}</span>
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
              {backendEnabled && <p className="text-[11px] text-foreground/50">Backend mode requires at least 10 characters.</p>}
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" disabled={backendEnabled && createTenantCourse.isPending} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60">
                {backendEnabled && createTenantCourse.isPending ? "Creating..." : "Create course"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
