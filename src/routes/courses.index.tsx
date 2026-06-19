import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, BookOpen, X, ArrowLeft, ImagePlus, MapPin, Video, Radio, Users, GraduationCap, ChevronRight } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext, useTenantModel } from "@/lib/app-context";
import { useRole } from "@/lib/roles";
import { useCreateTenantCourse, useUploadCourseCover, useTenantCourseGroups, useTenantCourses } from "@/lib/lms-core-api";
import { useLms, createCourse, classesForCourse, courseLessonCount } from "@/lib/lmsStore";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/courses/")({
  head: () => ({ meta: [{ title: i18n.t("courseLibraryPage.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const { t } = useTranslation();
  const state = useLms();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const tenantModel = useTenantModel();
  const academicMode = backendEnabled && tenantModel === "academic";
  const { role } = useRole();
  const isInstructor = role === "instructor";
  const coursesQuery = useTenantCourses();
  const groupsQuery = useTenantCourseGroups();
  const createTenantCourse = useCreateTenantCourse();
  const uploadCover = useUploadCourseCover();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", courseType: "offline" as "offline" | "online_live" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const backendCourses = coursesQuery.data?.items ?? [];
  const backendGroups = groupsQuery.data ?? [];
  const totalCourses = backendEnabled ? coursesQuery.data?.total ?? backendCourses.length : state.courses.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("courseLibraryPage.toast.titleRequired"));
      return;
    }
    if (backendEnabled && form.description.trim().length < 10) {
      toast.error(t("courseLibraryPage.toast.descriptionTooShort"));
      return;
    }

    if (backendEnabled) {
      try {
        const created = await createTenantCourse.mutateAsync({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          description: form.description.trim(),
          courseType: form.courseType,
        });
        if (coverFile) {
          try {
            await uploadCover.mutateAsync({ courseId: created.id, file: coverFile });
          } catch {
            toast.error("Course created but cover image upload failed");
          }
        }
        setForm({ title: "", subtitle: "", description: "", courseType: "offline" });
        setCoverFile(null);
        setCoverPreview(null);
        setOpen(false);
        toast.success(t("courseLibraryPage.toast.created", { title: created.title }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("courseLibraryPage.toast.createFailed"));
      }
      return;
    }

    const c = createCourse({
      title: form.title.trim(),
      subject: form.subtitle.trim() || undefined,
      description: form.description.trim() || undefined,
    });
    setForm({ title: "", subtitle: "", description: "", courseType: "offline" });
    setOpen(false);
    toast.success(t("courseLibraryPage.toast.created", { title: c.title }));
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("courseLibraryPage.topbar.title")}
        subtitle={t("courseLibraryPage.topbar.subtitle")}
        showStreak={false}
      />

      {isInstructor && (
        <Link
          to={academicMode ? "/classes" : "/groups"}
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          {academicMode ? t("courseLibraryPage.backToClasses") : t("courseLibraryPage.backToGroups")}
        </Link>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60 font-medium">
          {t("courseLibraryPage.courseCount", { count: totalCourses })}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" strokeWidth={3} /> {t("courseLibraryPage.actions.newCourse")}
        </button>
      </div>

      {backendEnabled && coursesQuery.isLoading ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-2">
          <p className="font-bold">{t("courseLibraryPage.state.loading")}</p>
        </div>
      ) : backendEnabled && coursesQuery.isError ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-12 text-center space-y-2">
          <p className="font-bold text-destructive">{t("courseLibraryPage.state.loadFailedTitle")}</p>
          <p className="text-sm text-foreground/60">{t("courseLibraryPage.state.loadFailedBody")}</p>
        </div>
      ) : (backendEnabled ? backendCourses.length === 0 : state.courses.length === 0) ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-2">
          <BookOpen className="size-8 mx-auto text-foreground/40" />
          <p className="font-bold">{t("courseLibraryPage.empty.title")}</p>
          <p className="text-sm text-foreground/60">{t("courseLibraryPage.empty.body")}</p>
        </div>
      ) : backendEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {backendCourses.map((course) => {
            const groups = backendGroups.filter((g) => g.courseId === course.id);
            const subject = course.category?.title ?? course.category?.name ?? course.subtitle;
            const typeIcon = course.courseType === "video" ? Video : course.courseType === "online_live" ? Radio : MapPin;
            const TypeIcon = typeIcon;
            const typeLabel = course.courseType === "video" ? "Video" : course.courseType === "online_live" ? "Online live" : "In-person";
            const typeCls = course.courseType === "video"
              ? "border-brand-primary-border bg-brand-primary-muted text-primary"
              : course.courseType === "online_live"
              ? "border-brand-secondary-border bg-brand-secondary-muted text-secondary"
              : "border-border bg-muted text-foreground/60";
            return (
              <Link
                key={course.id}
                to="/courses/$courseId"
                params={{ courseId: String(course.id) }}
                className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:-translate-y-0.5 hover:border-primary/30 transition-all flex flex-col"
              >
                {/* Cover area */}
                {course.coverImageUrl ? (
                  <div className="relative h-40 overflow-hidden">
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wide ${typeCls}`}>
                      <TypeIcon className="size-3" /> {typeLabel}
                    </span>
                    {!course.isPublished && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg border border-border bg-black/60 text-white text-[10px] font-black uppercase tracking-wide">Draft</span>
                    )}
                  </div>
                ) : (
                  <div className={`h-32 flex items-center justify-center relative ${
                    course.courseType === "video" ? "bg-brand-primary-muted" :
                    course.courseType === "online_live" ? "bg-brand-secondary-muted" :
                    "bg-muted"
                  }`}>
                    <TypeIcon className={`size-10 opacity-20 ${
                      course.courseType === "video" ? "text-primary" :
                      course.courseType === "online_live" ? "text-secondary" :
                      "text-foreground"
                    }`} />
                    <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wide ${typeCls}`}>
                      <TypeIcon className="size-3" /> {typeLabel}
                    </span>
                    {!course.isPublished && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg border border-border bg-muted text-foreground/50 text-[10px] font-black uppercase tracking-wide">Draft</span>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-2">
                  {subject && <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{subject}</p>}
                  <h3 className="font-black text-base leading-tight line-clamp-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-foreground/55 line-clamp-2 leading-relaxed">{course.description}</p>
                  )}

                  {/* Stats footer */}
                  <div className="mt-auto pt-3 border-t border-border flex items-center gap-3 text-xs font-bold text-foreground/50">
                    {course.lessonCount != null && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-3.5" />
                        {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                      </span>
                    )}
                    {course.enrolledStudents != null && course.enrolledStudents > 0 && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="size-3.5" />
                        {course.enrolledStudents}
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                      <Users className="size-3.5" />
                      {academicMode
                        ? t("courseLibraryPage.labels.classCount", { count: groups.length })
                        : t("courseLibraryPage.labels.groupCount", { count: groups.length })}
                    </span>
                    <ChevronRight className="size-3.5 text-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {state.courses.map((c) => {
            const classes = classesForCourse(state, c.id);
            const lessonCount = courseLessonCount(c);
            return (
              <Link
                key={c.id}
                to="/courses/$courseId"
                params={{ courseId: c.id }}
                className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:-translate-y-0.5 hover:border-primary/30 transition-all flex flex-col"
              >
                <div className="h-32 flex items-center justify-center bg-muted">
                  <BookOpen className="size-10 text-foreground/20" />
                </div>
                <div className="p-5 flex-1 flex flex-col gap-2">
                  {c.subject && <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{c.subject}</p>}
                  <h3 className="font-black text-base leading-tight line-clamp-2">{c.title}</h3>
                  {c.description && <p className="text-xs text-foreground/55 line-clamp-2 leading-relaxed">{c.description}</p>}
                  <div className="mt-auto pt-3 border-t border-border flex items-center gap-3 text-xs font-bold text-foreground/50">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {t("courseLibraryPage.labels.lessonCount", { count: lessonCount })}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Users className="size-3.5" />
                      {t("courseLibraryPage.labels.classCount", { count: classes.length })}
                    </span>
                    <ChevronRight className="size-3.5 text-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => { setOpen(false); setCoverFile(null); setCoverPreview(null); }}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{t("courseLibraryPage.modal.title")}</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setCoverFile(null); setCoverPreview(null); }}
                className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {backendEnabled && (
              <label className="block cursor-pointer">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/60 block mb-1.5">
                  {t("courseLibraryPage.modal.coverImage")}
                </span>
                {coverPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-border aspect-video">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCoverFile(null); setCoverPreview(null); }}
                      className="cursor-pointer absolute top-2 right-2 size-7 grid place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <ImagePlus className="size-5 text-foreground/40 shrink-0" />
                    <span className="text-sm text-foreground/60 font-medium">{t("courseLibraryPage.modal.coverImageCta")}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCoverFile(file);
                    const url = URL.createObjectURL(file);
                    setCoverPreview(url);
                  }}
                />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                {t("courseLibraryPage.modal.fieldTitle")}
              </span>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("courseLibraryPage.modal.titlePlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseLibraryPage.modal.fieldSubtitle")}</span>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder={t("courseLibraryPage.modal.subtitlePlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
              />
            </label>

            {backendEnabled && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/60 block">{t("courseLibraryPage.modal.courseType")}</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "offline", label: t("courseLibraryPage.modal.courseTypeOffline"), icon: MapPin },
                    { value: "online_live", label: t("courseLibraryPage.modal.courseTypeOnlineLive"), icon: Video },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, courseType: value })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-colors text-sm font-bold ${
                        form.courseType === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted text-foreground/70"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                {t("courseLibraryPage.modal.fieldDescription")}
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary resize-none"
              />
              {backendEnabled && (
                <p className="text-[11px] text-foreground/50">{t("courseLibraryPage.modal.descriptionHint")}</p>
              )}
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setCoverFile(null); setCoverPreview(null); }}
                className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted"
              >
                {t("courseLibraryPage.actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={backendEnabled && (createTenantCourse.isPending || uploadCover.isPending)}
                className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60"
              >
                {backendEnabled && (createTenantCourse.isPending || uploadCover.isPending)
                  ? t("courseLibraryPage.actions.creating")
                  : t("courseLibraryPage.actions.createCourse")}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
