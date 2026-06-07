import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, BookOpen, GraduationCap, X } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext, useTenantModel } from "@/lib/app-context";
import { useRole } from "@/lib/roles";
import { useAcademicClasses, useCreateAcademicClass, useCreateTenantCourseGroup, useTenantCourseGroups, useTenantCourses } from "@/lib/lms-core-api";
import { useLms, createClass, coursesForClass } from "@/lib/lmsStore";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — My Classes" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const state = useLms();
  const { context } = useAppContext();
  const { role } = useRole();
  const tenantModel = useTenantModel();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const academicMode = backendEnabled && tenantModel === "academic";
  const canManageAcademicClasses = academicMode && (role === "company_admin" || role === "owner");
  const groupsQuery = useTenantCourseGroups();
  const academicClassesQuery = useAcademicClasses();
  const coursesQuery = useTenantCourses();
  const createTenantCourseGroup = useCreateTenantCourseGroup();
  const createAcademicClass = useCreateAcademicClass();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", students: "", nextSession: "", courseId: "" });

  const backendGroups = groupsQuery.data ?? [];
  const academicClasses = academicClassesQuery.data?.items ?? [];
  const backendCourses = coursesQuery.data?.items ?? [];
  const assignableCourses = backendCourses.filter((course) => course.isPublished && course.status === "approved" && course.courseType !== "video");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendEnabled) {
      if (academicMode) {
        if (!form.title.trim() || !form.code.trim()) {
          toast.error("Name and code are required");
          return;
        }
        try {
          const created = await createAcademicClass.mutateAsync({
            name: form.title.trim(),
            code: form.code.trim(),
            gradeLevel: form.students.trim() || undefined,
            academicYear: form.nextSession.trim() || undefined,
          });
          setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
          setOpen(false);
          toast.success(`Academic class "${created.name}" created`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to create academic class");
        }
        return;
      }
      if (!form.title.trim() || !form.code.trim() || !form.courseId) {
        toast.error("Title, code, and course are required");
        return;
      }
      try {
        const created = await createTenantCourseGroup.mutateAsync({
          courseId: Number(form.courseId),
          name: form.title.trim(),
          code: form.code.trim(),
          seatLimit: form.students ? Number(form.students) || undefined : undefined,
          startDate: form.nextSession || undefined,
        });
        setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
        setOpen(false);
        toast.success(`Class "${created.name}" created`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create class");
      }
      return;
    }

    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required");
      return;
    }
    const created = createClass({
      title: form.title.trim(),
      code: form.code.trim(),
      students: Number(form.students) || 0,
      nextSession: form.nextSession.trim(),
    });
    setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
    setOpen(false);
    toast.success(`Class "${created.title}" created`);
  };

  return (
    <DashboardShell>
      <TopBar title="My Classes" subtitle={academicMode ? "Academic classes you can teach and review." : "All cohorts you're teaching this term."} showStreak={false} />

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-sm text-foreground/60 font-medium">{backendEnabled ? (academicMode ? academicClasses.length : backendGroups.length) : state.classes.length} active classes</p>
        <div className="flex items-center gap-2">
          {!academicMode && state.hierarchy.coursesEnabled && (
            <Link
              to="/courses"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-border bg-card font-bold text-sm hover:bg-muted transition-colors"
            >
              <BookOpen className="size-4" strokeWidth={2.5} /> Course library
            </Link>
          )}
          {(!academicMode || canManageAcademicClasses) ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" strokeWidth={3} /> {academicMode ? "New academic class" : "New class"}
          </button>
          ) : null}
        </div>
      </div>

      {academicMode && academicClassesQuery.isLoading ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold">Loading academic classes...</p>
        </div>
      ) : academicMode && academicClassesQuery.isError ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold text-destructive">Could not load academic classes</p>
          <p className="text-sm text-foreground/60">Backend mode is enabled, but the academic class list request failed.</p>
        </div>
      ) : academicMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {academicClasses.map((klass) => (
            <Link
              key={klass.id}
              to="/classes/$classId"
              params={{ classId: String(klass.id) }}
              className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
            >
              <div className="h-24 bg-gradient-to-br from-primary to-secondary relative">
                <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                  {klass.code}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/25 text-white text-[10px] font-black uppercase tracking-wider">
                  {klass.status}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-black text-lg leading-tight">{klass.name}</h3>
                <p className="text-xs text-foreground/60 font-bold">{klass.gradeLevel ?? klass.academicYear ?? "Academic class"}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" /> {klass.activeStudentCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" /> {klass.advisor?.fullName ?? klass.advisor?.email ?? "Advisor pending"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : backendEnabled && groupsQuery.isLoading ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold">Loading classes...</p>
        </div>
      ) : backendEnabled && groupsQuery.isError ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold text-destructive">Could not load classes</p>
          <p className="text-sm text-foreground/60">Backend mode is enabled, but the class list request failed.</p>
        </div>
      ) : backendEnabled ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {backendGroups.map((group) => (
            <Link
              key={group.id}
              to="/classes/$classId"
              params={{ classId: String(group.id) }}
              className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
            >
              <div className="h-24 bg-gradient-to-br from-primary to-secondary relative">
                <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                  {group.code}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/25 text-white text-[10px] font-black uppercase tracking-wider">
                  {group.status}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-black text-lg leading-tight">{group.name}</h3>
                <p className="text-xs text-foreground/60 font-bold">{group.course?.title ?? "Course"}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" /> {group.activeStudentCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> {group.startDate ? new Date(group.startDate).toLocaleDateString() : group.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {state.classes.map((c) => {
            const courses = coursesForClass(state, c.id);
            const badgeCount = state.hierarchy.coursesEnabled ? courses.length : c.lessons.length;
            const badgeNoun = state.hierarchy.coursesEnabled
              ? `course${courses.length === 1 ? "" : "s"}`
              : `lesson${c.lessons.length === 1 ? "" : "s"}`;
            return (
              <Link
                key={c.id}
                to="/classes/$classId"
                params={{ classId: c.id }}
                className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
              >
                <div className={`h-24 bg-gradient-to-br ${c.color} relative`}>
                  <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                    {c.code}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/25 text-white text-[10px] font-black uppercase tracking-wider">
                    {badgeCount} {badgeNoun}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-black text-lg leading-tight">{c.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" /> {c.students}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> {c.nextSession}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{academicMode ? "New academic class" : "New class"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <FormField label={academicMode ? "Class name" : "Title"}>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={academicMode ? "e.g. Grade 10-A" : "e.g. Linear Algebra"}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
            </FormField>

            <FormField label={academicMode ? "Class code" : "Course code"}>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={academicMode ? "e.g. 10A" : "e.g. MTH-220"}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
              />
            </FormField>

            {backendEnabled && !academicMode && (
              <FormField label="Course">
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select an approved live/offline course</option>
                  {assignableCourses.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label={academicMode ? "Grade level" : backendEnabled ? "Seat limit" : "Students"}>
                <input
                  type="number"
                  min={0}
                  value={form.students}
                  onChange={(e) => setForm({ ...form, students: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </FormField>
              <FormField label={academicMode ? "Academic year" : backendEnabled ? "Start date" : "Next session"}>
                <input
                  type={backendEnabled && !academicMode ? "date" : undefined}
                  value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                  placeholder={academicMode ? "e.g. 2026-2027" : backendEnabled ? "" : "Mon, 12:00"}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </FormField>
            </div>

            {backendEnabled && !academicMode && assignableCourses.length === 0 && (
              <p className="text-xs text-foreground/60">
                No approved offline or live courses are available yet. Publish an approved course first, then create the class.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={backendEnabled && createTenantCourseGroup.isPending} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60">
                {backendEnabled && createTenantCourseGroup.isPending ? "Creating..." : "Create class"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
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
