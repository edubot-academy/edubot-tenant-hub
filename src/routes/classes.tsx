import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, BookOpen, GraduationCap, X, Loader2 } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useEffect } from "react";
import { useAppContext, useTenantModel } from "@/lib/app-context";
import { useRole } from "@/lib/roles";
import { useAcademicClasses, useCreateAcademicClass, useCreateTenantCourseGroup, useTenantCourseGroups, useTenantCourses } from "@/lib/lms-core-api";
import { useLms, createClass, coursesForClass } from "@/lib/lmsStore";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — Classes" }] }),
  component: ClassesPage,
});

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-muted text-foreground/50 border-border",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
};

function statusPill(status: string) {
  const cls = STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

// ── class card ────────────────────────────────────────────────────────────────

function ClassCard({
  to, params, code, name, subtitle, studentCount, meta, status, color,
}: {
  to: string; params: Record<string, string>;
  code: string; name: string; subtitle: string;
  studentCount: number; meta: string; status: string;
  color?: string;
}) {
  const gradient = color ?? "from-primary to-secondary";

  return (
    <Link
      to={to}
      params={params}
      className="group bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      {/* header strip */}
      <div className={`h-20 bg-gradient-to-br ${gradient} relative flex items-end px-4 pb-3`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/80 absolute top-3 left-4">
          {code}
        </span>
        <div className="absolute top-3 right-3">
          {statusPill(status)}
        </div>
      </div>

      {/* body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-black text-base leading-tight truncate group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-xs text-foreground/50 font-medium mt-0.5 truncate">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold text-foreground/55 pt-2 border-t border-border/60">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {studentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 truncate">
            <Calendar className="size-3.5 shrink-0" /> {meta}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

function ClassesPage() {
  const state = useLms();
  const { context } = useAppContext();
  const { role } = useRole();
  const tenantModel = useTenantModel();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const academicMode = backendEnabled && tenantModel === "academic";

  useEffect(() => {
    document.title = academicMode ? "QuestLMS — Classes" : "QuestLMS — Groups";
  }, [academicMode]);
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
  const assignableCourses = backendCourses.filter((c) => c.isPublished && c.status === "approved" && c.courseType !== "video");

  const activeCount = backendEnabled
    ? (academicMode ? academicClasses.length : backendGroups.length)
    : state.classes.length;

  const isLoading = backendEnabled && (academicMode ? academicClassesQuery.isLoading : groupsQuery.isLoading);
  const isError = backendEnabled && (academicMode ? academicClassesQuery.isError : groupsQuery.isError);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendEnabled) {
      if (academicMode) {
        if (!form.title.trim() || !form.code.trim()) { toast.error("Name and code are required"); return; }
        try {
          const created = await createAcademicClass.mutateAsync({
            name: form.title.trim(), code: form.code.trim(),
            gradeLevel: form.students.trim() || undefined,
            academicYear: form.nextSession.trim() || undefined,
          });
          setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
          setOpen(false);
          toast.success(`Academic class "${created.name}" created`);
        } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to create academic class"); }
        return;
      }
      if (!form.title.trim() || !form.code.trim() || !form.courseId) { toast.error("Title, code, and course are required"); return; }
      try {
        const created = await createTenantCourseGroup.mutateAsync({
          courseId: Number(form.courseId), name: form.title.trim(), code: form.code.trim(),
          seatLimit: form.students ? Number(form.students) || undefined : undefined,
          startDate: form.nextSession || undefined,
        });
        setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
        setOpen(false);
        toast.success(`Group "${created.name}" created`);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to create class"); }
      return;
    }
    if (!form.title.trim() || !form.code.trim()) { toast.error("Title and code are required"); return; }
    const created = createClass({ title: form.title.trim(), code: form.code.trim(), students: Number(form.students) || 0, nextSession: form.nextSession.trim() });
    setForm({ title: "", code: "", students: "", nextSession: "", courseId: "" });
    setOpen(false);
    toast.success(`Group "${created.title}" created`);
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <TopBar
          title={academicMode ? "Classes" : "Groups"}
          subtitle={academicMode ? "Academic classes you can teach and review." : "Course groups and their sessions."}
          showStreak={false}
        />

        {/* toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-foreground/50">
            {academicMode
              ? `${activeCount} ${activeCount === 1 ? "class" : "classes"}`
              : `${activeCount} ${activeCount === 1 ? "group" : "groups"}`}
          </p>
          <div className="flex items-center gap-2">
            {!academicMode && state.hierarchy.coursesEnabled && (
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border bg-card font-bold text-sm hover:bg-muted transition-colors"
              >
                <BookOpen className="size-4" strokeWidth={2.5} /> Course library
              </Link>
            )}
            {(!academicMode || canManageAcademicClasses) && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
              >
                <Plus className="size-4" strokeWidth={3} />
                {academicMode ? "New class" : "New group"}
              </button>
            )}
          </div>
        </div>

        {/* content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-7 animate-spin text-foreground/30" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-card p-10 text-center">
            <p className="font-bold text-destructive">Could not load classes</p>
            <p className="text-sm text-foreground/50 mt-1">The request failed. Try refreshing.</p>
          </div>
        ) : academicMode ? (
          academicClasses.length === 0 ? (
            <EmptyState academicMode />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicClasses.map((klass) => (
                <ClassCard
                  key={klass.id}
                  to="/classes/$classId"
                  params={{ classId: String(klass.id) }}
                  code={klass.code}
                  name={klass.name}
                  subtitle={klass.gradeLevel ?? klass.academicYear ?? "Academic class"}
                  studentCount={klass.activeStudentCount ?? 0}
                  meta={klass.advisor?.fullName ?? klass.advisor?.email ?? "Advisor pending"}
                  status={klass.status}
                />
              ))}
            </div>
          )
        ) : backendEnabled ? (
          backendGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backendGroups.map((group) => (
                <ClassCard
                  key={group.id}
                  to="/classes/$classId"
                  params={{ classId: String(group.id) }}
                  code={group.code}
                  name={group.name}
                  subtitle={group.course?.title ?? "Course"}
                  studentCount={group.activeStudentCount ?? 0}
                  meta={group.startDate ? new Date(group.startDate).toLocaleDateString() : group.status}
                  status={group.status}
                />
              ))}
            </div>
          )
        ) : (
          state.classes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.classes.map((c) => {
                const courses = coursesForClass(state, c.id);
                const badgeCount = state.hierarchy.coursesEnabled ? courses.length : c.lessons.length;
                const noun = state.hierarchy.coursesEnabled ? `course${courses.length === 1 ? "" : "s"}` : `lesson${c.lessons.length === 1 ? "" : "s"}`;
                return (
                  <ClassCard
                    key={c.id}
                    to="/classes/$classId"
                    params={{ classId: c.id }}
                    code={c.code}
                    name={c.title}
                    subtitle={`${badgeCount} ${noun}`}
                    studentCount={c.students}
                    meta={c.nextSession}
                    status="active"
                    color={c.color}
                  />
                );
              })}
            </div>
          )
        )}
      </div>

      {/* create modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-card border-2 border-border rounded-2xl p-6 chunky-shadow space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{academicMode ? "New class" : "New group"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="size-8 grid place-items-center rounded-lg hover:bg-muted transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <FormField label={academicMode ? "Class name" : "Group name"}>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={academicMode ? "e.g. Grade 10-A" : "e.g. Morning Cohort"}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" autoFocus />
            </FormField>

            <FormField label={academicMode ? "Class code" : "Course code"}>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={academicMode ? "e.g. 10A" : "e.g. MTH-220"}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>

            {backendEnabled && !academicMode && (
              <FormField label="Course">
                <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary">
                  <option value="">Select an approved live/offline course</option>
                  {assignableCourses.map((course) => (
                    <option key={course.id} value={String(course.id)}>{course.title}</option>
                  ))}
                </select>
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label={academicMode ? "Grade level" : backendEnabled ? "Seat limit" : "Students"}>
                <input type={academicMode ? "text" : "number"} min={0} value={form.students}
                  onChange={(e) => setForm({ ...form, students: e.target.value })} placeholder={academicMode ? "e.g. Grade 10" : "0"}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
              </FormField>
              <FormField label={academicMode ? "Academic year" : backendEnabled ? "Start date" : "Next session"}>
                <input type={backendEnabled && !academicMode ? "date" : undefined} value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                  placeholder={academicMode ? "e.g. 2026-2027" : backendEnabled ? "" : "Mon, 12:00"}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
              </FormField>
            </div>

            {backendEnabled && !academicMode && assignableCourses.length === 0 && (
              <p className="text-xs text-foreground/50">No approved offline or live courses yet. Publish an approved course first.</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={backendEnabled && (createTenantCourseGroup.isPending || createAcademicClass.isPending)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60 transition-opacity">
                {backendEnabled && (createTenantCourseGroup.isPending || createAcademicClass.isPending) ? "Creating…" : academicMode ? "Create class" : "Create group"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}

function EmptyState({ academicMode }: { academicMode?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
      {academicMode
        ? <GraduationCap className="size-10 text-foreground/20" strokeWidth={1.5} />
        : <Users className="size-10 text-foreground/20" strokeWidth={1.5} />}
      <p className="text-sm font-bold text-foreground/50">{academicMode ? "No classes yet" : "No groups yet"}</p>
      <p className="text-xs text-foreground/40">{academicMode ? "Create your first class to get started." : "Create a group to start organizing course sessions."}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</span>
      {children}
    </label>
  );
}
