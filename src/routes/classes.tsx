import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, BookOpen, GraduationCap, X, Loader2 } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext, useTenantModel } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import { useRole } from "@/lib/roles";
import { useAcademicClasses, useCreateAcademicClass, useCreateTenantCourseGroup, useTenantCourseGroups, useTenantCourses } from "@/lib/lms-core-api";
import { useLms, createClass, coursesForClass } from "@/lib/lmsStore";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: i18n.t("classesPage.metaTitle", { appName: i18n.t("app.name"), defaultValue: "{{appName}} — Classes & Groups" }) }] }),
  component: ClassesPage,
});

const STATUS_COLORS: Record<string, string> = { active: "bg-emerald-100 text-emerald-700 border-emerald-200", inactive: "bg-muted text-foreground/50 border-border", completed: "bg-blue-100 text-blue-700 border-blue-200", draft: "bg-amber-100 text-amber-700 border-amber-200" };
const emptyForm = { title: "", code: "", students: "", nextSession: "", courseId: "" };

function statusPill(status: string, label: string) {
  const cls = STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS.inactive;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function ClassCard({ to, params, code, name, subtitle, studentCount, meta, status, statusLabel, color }: { to: string; params: Record<string, string>; code: string; name: string; subtitle: string; studentCount: number; meta: string; status: string; statusLabel: string; color?: string }) {
  return (
    <Link to={to} params={params} className="group bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all">
      <div className={`h-20 bg-gradient-to-br ${color ?? "from-primary to-secondary"} relative flex items-end px-4 pb-3`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/80 absolute top-3 left-4">{code}</span>
        <div className="absolute top-3 right-3">{statusPill(status, statusLabel)}</div>
      </div>
      <div className="p-4 space-y-3"><div><h3 className="font-black text-base leading-tight truncate group-hover:text-primary transition-colors">{name}</h3><p className="text-xs text-foreground/50 font-medium mt-0.5 truncate">{subtitle}</p></div><div className="flex items-center gap-4 text-[11px] font-bold text-foreground/55 pt-2 border-t border-border/60"><span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {studentCount}</span><span className="inline-flex items-center gap-1.5 truncate"><Calendar className="size-3.5 shrink-0" /> {meta}</span></div></div>
    </Link>
  );
}

function ClassesPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const state = useLms();
  const { context } = useAppContext();
  const { role } = useRole();
  const tenantModel = useTenantModel();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const academicMode = backendEnabled && tenantModel === "academic";
  useEffect(() => { document.title = i18n.t(academicMode ? "classesPage.documentTitle.classes" : "classesPage.documentTitle.groups", { appName: i18n.t("app.name"), defaultValue: academicMode ? "{{appName}} — Classes" : "{{appName}} — Groups" }); }, [academicMode]);
  const canManageAcademicClasses = academicMode && (role === "company_admin" || role === "owner");
  const groupsQuery = useTenantCourseGroups();
  const academicClassesQuery = useAcademicClasses();
  const coursesQuery = useTenantCourses();
  const createTenantCourseGroup = useCreateTenantCourseGroup();
  const createAcademicClass = useCreateAcademicClass();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const backendGroups = groupsQuery.data ?? [];
  const academicClasses = academicClassesQuery.data?.items ?? [];
  const assignableCourses = (coursesQuery.data?.items ?? []).filter((course) => course.isPublished && course.status === "approved" && course.courseType !== "video");
  const activeCount = backendEnabled ? (academicMode ? academicClasses.length : backendGroups.length) : state.classes.length;
  const isLoading = backendEnabled && (academicMode ? academicClassesQuery.isLoading : groupsQuery.isLoading);
  const isError = backendEnabled && (academicMode ? academicClassesQuery.isError : groupsQuery.isError);
  const statusLabel = (status: string) => t(`classesPage.status.${status.toLowerCase()}`, { defaultValue: status });
  const fmtDate = (value: string) => new Date(value).toLocaleDateString(activeI18n.language);
  const reset = () => { setForm(emptyForm); setOpen(false); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (backendEnabled && academicMode) {
      if (!form.title.trim() || !form.code.trim()) return toast.error(t("classesPage.toast.classNameCodeRequired", { defaultValue: "Name and code are required" }));
      try { const created = await createAcademicClass.mutateAsync({ name: form.title.trim(), code: form.code.trim(), gradeLevel: form.students.trim() || undefined, academicYear: form.nextSession.trim() || undefined }); reset(); toast.success(t("classesPage.toast.classCreated", { name: created.name, defaultValue: "Academic class \"{{name}}\" created" })); }
      catch (error) { toast.error(error instanceof Error ? error.message : t("classesPage.toast.classCreateFailed", { defaultValue: "Failed to create academic class" })); }
      return;
    }
    if (backendEnabled) {
      if (!form.title.trim() || !form.code.trim() || !form.courseId) return toast.error(t("classesPage.toast.groupRequired", { defaultValue: "Title, code, and course are required" }));
      try { const created = await createTenantCourseGroup.mutateAsync({ courseId: Number(form.courseId), name: form.title.trim(), code: form.code.trim(), seatLimit: form.students ? Number(form.students) || undefined : undefined, startDate: form.nextSession || undefined }); reset(); toast.success(t("classesPage.toast.groupCreated", { name: created.name, defaultValue: "Group \"{{name}}\" created" })); }
      catch (error) { toast.error(error instanceof Error ? error.message : t("classesPage.toast.groupCreateFailed", { defaultValue: "Failed to create group" })); }
      return;
    }
    if (!form.title.trim() || !form.code.trim()) return toast.error(t("classesPage.toast.titleCodeRequired", { defaultValue: "Title and code are required" }));
    const created = createClass({ title: form.title.trim(), code: form.code.trim(), students: Number(form.students) || 0, nextSession: form.nextSession.trim() });
    reset(); toast.success(t("classesPage.toast.groupCreated", { name: created.title, defaultValue: "Group \"{{name}}\" created" }));
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <TopBar title={academicMode ? t("classesPage.topbar.classesTitle", { defaultValue: "Classes" }) : t("classesPage.topbar.groupsTitle", { defaultValue: "Groups" })} subtitle={academicMode ? t("classesPage.topbar.classesSubtitle", { defaultValue: "Academic classes you can teach and review." }) : t("classesPage.topbar.groupsSubtitle", { defaultValue: "Course groups and their sessions." })} showStreak={false} />
        <div className="flex items-center justify-between gap-3 flex-wrap"><p className="text-sm font-bold text-foreground/50">{academicMode ? t("classesPage.count.classes", { count: activeCount, defaultValue: "{{count}} classes" }) : t("classesPage.count.groups", { count: activeCount, defaultValue: "{{count}} groups" })}</p><div className="flex items-center gap-2">{!academicMode && state.hierarchy.coursesEnabled && <Link to="/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border bg-card font-bold text-sm hover:bg-muted transition-colors"><BookOpen className="size-4" strokeWidth={2.5} /> {t("classesPage.actions.courseLibrary", { defaultValue: "Course library" })}</Link>}{(!academicMode || canManageAcademicClasses) && <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"><Plus className="size-4" strokeWidth={3} />{academicMode ? t("classesPage.actions.newClass", { defaultValue: "New class" }) : t("classesPage.actions.newGroup", { defaultValue: "New group" })}</button>}</div></div>
        {isLoading ? <div className="flex items-center justify-center py-24" aria-label={t("classesPage.state.loading", { defaultValue: "Loading classes and groups…" })}><Loader2 className="size-7 animate-spin text-foreground/30" /></div> : isError ? <ErrorState /> : academicMode ? (academicClasses.length === 0 ? <EmptyState academicMode /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{academicClasses.map((klass) => <ClassCard key={klass.id} to="/classes/$classId" params={{ classId: String(klass.id) }} code={klass.code} name={klass.name} subtitle={klass.gradeLevel ?? klass.academicYear ?? t("classesPage.labels.academicClass", { defaultValue: "Academic class" })} studentCount={klass.activeStudentCount ?? 0} meta={klass.advisor?.fullName ?? klass.advisor?.email ?? t("classesPage.labels.advisorPending", { defaultValue: "Advisor pending" })} status={klass.status} statusLabel={statusLabel(klass.status)} />)}</div>) : backendEnabled ? (backendGroups.length === 0 ? <EmptyState /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{backendGroups.map((group) => <ClassCard key={group.id} to="/classes/$classId" params={{ classId: String(group.id) }} code={group.code} name={group.name} subtitle={group.course?.title ?? t("classesPage.labels.course", { defaultValue: "Course" })} studentCount={group.activeStudentCount ?? 0} meta={group.startDate ? fmtDate(group.startDate) : statusLabel(group.status)} status={group.status} statusLabel={statusLabel(group.status)} />)}</div>) : (state.classes.length === 0 ? <EmptyState /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{state.classes.map((klass) => { const courses = coursesForClass(state, klass.id); const badgeCount = state.hierarchy.coursesEnabled ? courses.length : klass.lessons.length; const noun = state.hierarchy.coursesEnabled ? t("classesPage.count.courseNoun", { count: courses.length, defaultValue: courses.length === 1 ? "course" : "courses" }) : t("classesPage.count.lessonNoun", { count: klass.lessons.length, defaultValue: klass.lessons.length === 1 ? "lesson" : "lessons" }); return <ClassCard key={klass.id} to="/classes/$classId" params={{ classId: klass.id }} code={klass.code} name={klass.title} subtitle={`${badgeCount} ${noun}`} studentCount={klass.students} meta={klass.nextSession} status="active" statusLabel={statusLabel("active")} color={klass.color} />; })}</div>)}
      </div>
      {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}><form onClick={(event) => event.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-card border-2 border-border rounded-2xl p-6 chunky-shadow space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-black">{academicMode ? t("classesPage.modal.newClass", { defaultValue: "New class" }) : t("classesPage.modal.newGroup", { defaultValue: "New group" })}</h2><button type="button" onClick={() => setOpen(false)} aria-label={t("classesPage.actions.close", { defaultValue: "Close" })} className="size-8 grid place-items-center rounded-lg hover:bg-muted transition-colors"><X className="size-4" /></button></div><ClassFormFields academicMode={academicMode} backendEnabled={backendEnabled} form={form} setForm={setForm} assignableCourses={assignableCourses} /><div className="flex items-center justify-end gap-2 pt-1"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted transition-colors">{t("classesPage.actions.cancel", { defaultValue: "Cancel" })}</button><button type="submit" disabled={backendEnabled && (createTenantCourseGroup.isPending || createAcademicClass.isPending)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60 transition-opacity">{backendEnabled && (createTenantCourseGroup.isPending || createAcademicClass.isPending) ? t("classesPage.actions.creating", { defaultValue: "Creating…" }) : academicMode ? t("classesPage.actions.createClass", { defaultValue: "Create class" }) : t("classesPage.actions.createGroup", { defaultValue: "Create group" })}</button></div></form></div>}
    </DashboardShell>
  );
}

function ClassFormFields({ academicMode, backendEnabled, form, setForm, assignableCourses }: { academicMode: boolean; backendEnabled: boolean; form: typeof emptyForm; setForm: (form: typeof emptyForm) => void; assignableCourses: { id: number; title: string }[] }) {
  const { t } = useTranslation();
  return <><FormField label={academicMode ? t("classesPage.form.className", { defaultValue: "Class name" }) : t("classesPage.form.groupName", { defaultValue: "Group name" })}><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={academicMode ? t("classesPage.form.classNamePlaceholder", { defaultValue: "e.g. Grade 10-A" }) : t("classesPage.form.groupNamePlaceholder", { defaultValue: "e.g. Morning Cohort" })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" autoFocus /></FormField><FormField label={academicMode ? t("classesPage.form.classCode", { defaultValue: "Class code" }) : t("classesPage.form.courseCode", { defaultValue: "Course code" })}><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder={academicMode ? t("classesPage.form.classCodePlaceholder", { defaultValue: "e.g. 10A" }) : t("classesPage.form.courseCodePlaceholder", { defaultValue: "e.g. MTH-220" })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" /></FormField>{backendEnabled && !academicMode && <FormField label={t("classesPage.form.course", { defaultValue: "Course" })}><select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"><option value="">{t("classesPage.form.selectCourse", { defaultValue: "Select an approved live/offline course" })}</option>{assignableCourses.map((course) => <option key={course.id} value={String(course.id)}>{course.title}</option>)}</select></FormField>}<div className="grid grid-cols-2 gap-3"><FormField label={academicMode ? t("classesPage.form.gradeLevel", { defaultValue: "Grade level" }) : backendEnabled ? t("classesPage.form.seatLimit", { defaultValue: "Seat limit" }) : t("classesPage.form.students", { defaultValue: "Students" })}><input type={academicMode ? "text" : "number"} min={0} value={form.students} onChange={(event) => setForm({ ...form, students: event.target.value })} placeholder={academicMode ? t("classesPage.form.gradeLevelPlaceholder", { defaultValue: "e.g. Grade 10" }) : "0"} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" /></FormField><FormField label={academicMode ? t("classesPage.form.academicYear", { defaultValue: "Academic year" }) : backendEnabled ? t("classesPage.form.startDate", { defaultValue: "Start date" }) : t("classesPage.form.nextSession", { defaultValue: "Next session" })}><input type={backendEnabled && !academicMode ? "date" : undefined} value={form.nextSession} onChange={(event) => setForm({ ...form, nextSession: event.target.value })} placeholder={academicMode ? t("classesPage.form.academicYearPlaceholder", { defaultValue: "e.g. 2026-2027" }) : backendEnabled ? "" : t("classesPage.form.nextSessionPlaceholder", { defaultValue: "Mon, 12:00" })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" /></FormField></div>{backendEnabled && !academicMode && assignableCourses.length === 0 && <p className="text-xs text-foreground/50">{t("classesPage.form.noAssignableCourses", { defaultValue: "No approved offline or live courses yet. Publish an approved course first." })}</p>}</>;
}

function ErrorState() { const { t } = useTranslation(); return <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-card p-10 text-center"><p className="font-bold text-destructive">{t("classesPage.state.loadFailedTitle", { defaultValue: "Could not load classes" })}</p><p className="text-sm text-foreground/50 mt-1">{t("classesPage.state.loadFailedBody", { defaultValue: "The request failed. Try refreshing." })}</p></div>; }
function EmptyState({ academicMode }: { academicMode?: boolean }) { const { t } = useTranslation(); return <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3 text-center">{academicMode ? <GraduationCap className="size-10 text-foreground/20" strokeWidth={1.5} /> : <Users className="size-10 text-foreground/20" strokeWidth={1.5} />}<p className="text-sm font-bold text-foreground/50">{academicMode ? t("classesPage.empty.noClasses", { defaultValue: "No classes yet" }) : t("classesPage.empty.noGroups", { defaultValue: "No groups yet" })}</p><p className="text-xs text-foreground/40">{academicMode ? t("classesPage.empty.createFirstClass", { defaultValue: "Create your first class to get started." }) : t("classesPage.empty.createFirstGroup", { defaultValue: "Create a group to start organizing course sessions." })}</p></div>; }
function FormField({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</span>{children}</label>; }
