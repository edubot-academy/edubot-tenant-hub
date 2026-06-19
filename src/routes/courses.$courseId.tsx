import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  ArrowLeft, Plus, X, Video, FileText, HelpCircle, ClipboardList, Radio, Trash2, FolderPlus,
  Sparkles, ClipboardCheck, UserPlus, Users, MapPin, Link as LinkIcon, Calendar, GraduationCap,
  UserMinus,
} from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useCreateTenantLesson,
  useCreateTenantSection,
  useDeleteTenantLesson,
  useDeleteTenantSection,
  useTenantCourse,
  useCourseGroupsByCourse,
  useTenantCourseSections,
  useCourseEnrolledStudents,
  useUnenrollFromCourse,
} from "@/lib/lms-core-api";
import {
  useLms, addLesson, deleteLesson, addModule, deleteModule, classesForCourse,
  getPlacementTest, enrollmentsForCourse, type LessonType,
} from "@/lib/lmsStore";
import { CurriculumImportDialog } from "@/components/lms/CurriculumImportDialog";
import { PlacementTestDialog } from "@/components/lms/PlacementTestDialog";
import { EnrollIndividualDialog } from "@/components/lms/EnrollIndividualDialog";
import { IndividualGroupDialog } from "@/components/lms/IndividualGroupDialog";
import { CreateGroupDialog } from "@/components/lms/CreateGroupDialog";
import { VideoEnrollDialog } from "@/components/lms/VideoEnrollDialog";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: i18n.t("courseDetailPage.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: CourseDetailPage,
});

function iconFor(type: LessonType) {
  const iconMap: Record<LessonType, typeof Video> = {
    video: Video,
    reading: FileText,
    quiz: HelpCircle,
    assignment: ClipboardList,
    live: Radio,
  };
  return iconMap[type] ?? FileText;
}

function CourseDetailPage() {
  const { t } = useTranslation();
  const { courseId } = Route.useParams();
  const state = useLms();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const numericCourseId = Number(courseId);
  const backendCourseId = Number.isFinite(numericCourseId) && numericCourseId > 0 ? numericCourseId : null;
  const courseQuery = useTenantCourse(backendCourseId);
  const sectionsQuery = useTenantCourseSections(backendCourseId, courseQuery.data?.courseType);
  const groupsQuery = useCourseGroupsByCourse(backendCourseId);
  const createSectionMutation = useCreateTenantSection(backendCourseId);
  const deleteSectionMutation = useDeleteTenantSection(backendCourseId);
  const createLessonMutation = useCreateTenantLesson(backendCourseId);
  const deleteLessonMutation = useDeleteTenantLesson(backendCourseId);
  const enrolledStudentsQuery = useCourseEnrolledStudents(backendEnabled && courseQuery.data?.courseType === "video" ? backendCourseId : null);
  const unenrollMutation = useUnenrollFromCourse();
  const course = state.courses.find((c) => c.id === courseId);
  const modulesEnabled = state.hierarchy.modulesEnabled;
  const usedIn = course ? classesForCourse(state, courseId) : [];
  const placement = course ? getPlacementTest(state, courseId) : undefined;
  const individualCount = course ? enrollmentsForCourse(state, courseId).filter((e) => !e.classId).length : 0;
  const backendCourse = courseQuery.data ?? null;
  const backendSections = sectionsQuery.data ?? [];
  const backendUsedIn = groupsQuery.data ?? [];

  const [lessonModalFor, setLessonModalFor] = useState<{ moduleId?: string; sectionId?: number } | null>(null);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [individualGroupOpen, setIndividualGroupOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [videoEnrollOpen, setVideoEnrollOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [form, setForm] = useState<{ title: string; type: LessonType; durationMin: string }>({
    title: "", type: "video", durationMin: "",
  });
  const isVideoType = backendEnabled && backendCourse?.courseType === "video";
  const prototypeLessonTypes: { type: LessonType; label: string; icon: typeof Video }[] = [
    { type: "video", label: t("courseDetailPage.lessonTypes.video"), icon: Video },
    { type: "reading", label: t("courseDetailPage.lessonTypes.reading"), icon: FileText },
    { type: "quiz", label: t("courseDetailPage.lessonTypes.quiz"), icon: HelpCircle },
    { type: "assignment", label: t("courseDetailPage.lessonTypes.assignment"), icon: ClipboardList },
    { type: "live", label: t("courseDetailPage.lessonTypes.live"), icon: Radio },
  ];
  const backendLessonTypes: { type: LessonType; label: string; icon: typeof Video }[] = [
    { type: "video", label: t("courseDetailPage.lessonTypes.video"), icon: Video },
    { type: "reading", label: t("courseDetailPage.lessonTypes.article"), icon: FileText },
    { type: "quiz", label: t("courseDetailPage.lessonTypes.quiz"), icon: HelpCircle },
    { type: "assignment", label: t("courseDetailPage.lessonTypes.code"), icon: ClipboardList },
  ];
  const lessonTypesResolved = backendEnabled ? backendLessonTypes : prototypeLessonTypes;
  const displayTitle = backendEnabled ? backendCourse?.title : course?.title;
  const displaySubtitle = backendEnabled
    ? backendCourse?.category?.title ?? backendCourse?.category?.name ?? backendCourse?.subtitle ?? t("courseDetailPage.labels.course")
    : course?.subject ?? t("courseDetailPage.labels.courseTemplate");
  const displayDescription = backendEnabled ? backendCourse?.description : course?.description;

  if (backendEnabled && courseQuery.isLoading) {
    return (
      <DashboardShell>
        <TopBar title={t("courseDetailPage.state.loadingCourse")} showStreak={false} />
      </DashboardShell>
    );
  }

  if ((backendEnabled && !backendCourse) || (!backendEnabled && !course)) {
    return (
      <DashboardShell>
        <TopBar title={t("courseDetailPage.state.notFound")} showStreak={false} />
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> {t("courseDetailPage.actions.backToLibrary")}
        </Link>
      </DashboardShell>
    );
  }

  const submitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(t("courseDetailPage.toast.lessonTitleRequired")); return; }
    if (backendEnabled) {
      if (!lessonModalFor?.sectionId) {
        toast.error(t("courseDetailPage.toast.pickSectionFirst"));
        return;
      }
      try {
        const section = backendSections.find((item) => item.id === lessonModalFor.sectionId);
        await createLessonMutation.mutateAsync({
          sectionId: lessonModalFor.sectionId,
          title: form.title.trim(),
          kind: mapLessonTypeToBackendKind(form.type),
          duration: form.durationMin ? Number(form.durationMin) : undefined,
          order: (section?.lessons.length ?? 0) + 1,
        });
        setForm({ title: "", type: "video", durationMin: "" });
        setLessonModalFor(null);
        toast.success(t("courseDetailPage.toast.lessonAdded"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("courseDetailPage.toast.lessonAddFailed"));
      }
      return;
    }
    addLesson(courseId, {
      title: form.title.trim(),
      type: form.type,
      durationMin: form.durationMin ? Number(form.durationMin) : undefined,
      moduleId: lessonModalFor?.moduleId,
    });
    setForm({ title: "", type: "video", durationMin: "" });
    setLessonModalFor(null);
    toast.success(t("courseDetailPage.toast.lessonAdded"));
  };

  const submitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) { toast.error(t("courseDetailPage.toast.moduleTitleRequired")); return; }
    if (backendEnabled) {
      try {
        await createSectionMutation.mutateAsync({
          title: moduleTitle.trim(),
          order: backendSections.length + 1,
        });
        setModuleTitle("");
        setModuleOpen(false);
        toast.success(t("courseDetailPage.toast.sectionAdded"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("courseDetailPage.toast.sectionAddFailed"));
      }
      return;
    }
    addModule(courseId, moduleTitle.trim());
    setModuleTitle("");
    setModuleOpen(false);
    toast.success(t("courseDetailPage.toast.moduleAdded"));
  };

  return (
    <DashboardShell>
      <TopBar title={displayTitle ?? t("courseDetailPage.labels.course")} subtitle={displaySubtitle} showStreak={false} />

      <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> {t("courseDetailPage.actions.courseLibrary")}
      </Link>

      {backendEnabled && backendCourse?.coverImageUrl && (
        <div className="mb-6 rounded-3xl overflow-hidden border-2 border-border chunky-shadow max-h-64">
          <img
            src={backendCourse.coverImageUrl}
            alt={backendCourse.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {displayDescription && <p className="text-sm text-foreground/70 mb-4 max-w-2xl">{displayDescription}</p>}

      {backendEnabled && backendCourse && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border-2 text-xs font-black uppercase tracking-wide ${
            backendCourse.courseType === "video" ? "border-brand-primary-border bg-brand-primary-muted text-primary" :
            backendCourse.courseType === "online_live" ? "border-brand-secondary-border bg-brand-secondary-muted text-secondary" :
            "border-border bg-muted text-foreground/70"
          }`}>
            {backendCourse.courseType === "video"
              ? t("courseDetailPage.courseType.video")
              : backendCourse.courseType === "online_live"
                ? t("courseDetailPage.courseType.onlineLive")
                : backendCourse.courseType === "offline"
                  ? t("courseDetailPage.courseType.offline")
                  : backendCourse.courseType}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border-2 text-xs font-black uppercase tracking-wide ${
            backendCourse.isPublished ? "border-green-400/40 bg-green-400/5 text-green-700 dark:text-green-400" : "border-border bg-muted text-foreground/50"
          }`}>
            {backendCourse.isPublished ? t("courseDetailPage.status.published") : backendCourse.status ?? t("courseDetailPage.status.draft")}
          </span>
          {backendCourse.enrolledStudents != null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold text-foreground/70">
              <GraduationCap className="size-3.5" /> {t("courseDetailPage.labels.enrolledCount", { count: backendCourse.enrolledStudents })}
            </span>
          )}
          {backendCourse.lessonCount != null && backendCourse.courseType === "video" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold text-foreground/70">
              {t("courseDetailPage.labels.lessonCount", { count: backendCourse.lessonCount })}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {!backendEnabled && (
          <button type="button" onClick={() => setCurriculumOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-primary bg-primary/5 text-primary font-bold text-xs hover:bg-primary/10">
            <Sparkles className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.generateLessons")}
          </button>
        )}
        {!backendEnabled && (
          <button type="button" onClick={() => setPlacementOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
            <ClipboardCheck className="size-3.5" strokeWidth={3} />
            {placement
              ? t("courseDetailPage.labels.placementSummary", { count: placement.questions.length, mode: placement.mode })
              : t("courseDetailPage.actions.setupPlacementTest")}
          </button>
        )}
        {backendEnabled && !isVideoType && (
          <button type="button" onClick={() => setCreateGroupOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
            <Users className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.newGroup")}
          </button>
        )}
        {backendEnabled && !isVideoType && (
          <button type="button" onClick={() => setIndividualGroupOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
            <UserPlus className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.newIndividualGroup")}
          </button>
        )}
        {backendEnabled && isVideoType && (
          <button type="button" onClick={() => setVideoEnrollOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
            <UserPlus className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.enrollStudent")}
          </button>
        )}
        {!backendEnabled && (
          <button type="button" onClick={() => setEnrollOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
            <UserPlus className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.individualEnrollments", { count: individualCount })}
          </button>
        )}
      </div>

      {(backendEnabled ? backendUsedIn.length > 0 : usedIn.length > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.labels.assignedTo")}</span>
          {backendEnabled
            ? backendUsedIn.map((group) => (
                <Link
                  key={group.id}
                  to={group.deliveryMode === "individual" ? "/groups/$groupId" : "/classes/$classId"}
                  params={group.deliveryMode === "individual" ? { groupId: String(group.id) } : { classId: String(group.id) }}
                  className="px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold hover:bg-muted"
                >
                  {group.name}{group.deliveryMode === "individual" ? ` (${t("courseDetailPage.labels.oneOnOne")})` : ""}
                </Link>
              ))
            : usedIn.map((k) => (
                <Link key={k.id} to="/classes/$classId" params={{ classId: k.id }} className="px-2.5 py-1 rounded-lg border-2 border-border bg-card text-xs font-bold hover:bg-muted">
                  {k.title}
                </Link>
              ))}
        </div>
      )}

      {backendEnabled && !isVideoType && backendCourse && (
        <section className="space-y-4 mb-6">
          <h3 className="text-lg font-black">{t("courseDetailPage.sections.groups")}</h3>
          {groupsQuery.isLoading ? (
            <p className="text-sm text-foreground/50">{t("courseDetailPage.state.loadingGroups")}</p>
          ) : backendUsedIn.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">{t("courseDetailPage.empty.noGroupsTitle")}</p>
              <p className="text-sm text-foreground/60">{t("courseDetailPage.empty.noGroupsBody")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backendUsedIn.map((group) => (
                <Link
                  key={group.id}
                  to={group.deliveryMode === "individual" ? "/groups/$groupId" : "/groups/$groupId"}
                  params={{ groupId: String(group.id) }}
                  className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all space-y-3 block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{group.code}</p>
                      <h4 className="font-black text-base leading-tight truncate">{group.name}</h4>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide ${
                      group.status === "active" ? "border-green-400/40 bg-green-400/5 text-green-700 dark:text-green-400" :
                      group.status === "completed" ? "border-border bg-muted text-foreground/50" :
                      "border-primary/30 bg-primary/5 text-primary"
                    }`}>{t(`courseDetailPage.groupStatus.${group.status}`, { defaultValue: group.status })}</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-medium text-foreground/60">
                    {group.startDate && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        {new Date(group.startDate).toLocaleDateString()}{group.endDate ? ` – ${new Date(group.endDate).toLocaleDateString()}` : ""}
                      </p>
                    )}
                    {backendCourse.courseType === "offline" && group.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" /> {group.location}
                      </p>
                    )}
                    {backendCourse.courseType === "online_live" && group.meetingUrl && (
                      <p className="flex items-center gap-1.5 truncate">
                        <LinkIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{group.meetingProvider ?? t("courseDetailPage.labels.meeting")}: {group.meetingUrl}</span>
                      </p>
                    )}
                    {group.scheduleBlocks && group.scheduleBlocks.length > 0 && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        {group.scheduleBlocks.map((b) => `${b.day} ${b.startTime}–${b.endTime}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 text-xs font-bold text-foreground/55">
                    <Users className="size-3.5" /> {t("courseDetailPage.labels.studentsCount", { count: group.activeStudentCount ?? 0 })}
                    {group.seatLimit && <span className="ml-auto text-foreground/40">{t("courseDetailPage.labels.seatUsage", { count: group.seatLimit })}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {(!backendEnabled || isVideoType) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-black">{t("courseDetailPage.sections.content")}</h3>
            {!isVideoType && (
              <div className="flex gap-2">
                {(!backendEnabled && modulesEnabled) && (
                  <button type="button" onClick={() => setModuleOpen(true)} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted">
                    <FolderPlus className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.addModule")}
                  </button>
                )}
                <button type="button" onClick={() => setLessonModalFor({})} className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90">
                  <Plus className="size-3.5" strokeWidth={3} /> {t("courseDetailPage.actions.addLesson")}
                </button>
              </div>
            )}
          </div>

          {backendEnabled ? (
            backendSections.length > 0 ? (
              <div className="space-y-4">
                {backendSections.map((section, index) => (
                  <div key={section.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("courseDetailPage.labels.sectionNumber", { count: index + 1 })}</p>
                        <h4 className="font-black text-base">{section.title}</h4>
                      </div>
                    </div>
                    {section.lessons.length === 0 ? (
                      <p className="text-xs text-foreground/60 italic">{t("courseDetailPage.empty.noSectionLessons")}</p>
                    ) : (
                      <BackendLessonList lessons={section.lessons} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
                <p className="font-bold">{t("courseDetailPage.empty.noSectionsTitle")}</p>
                <p className="text-sm text-foreground/60">{t("courseDetailPage.empty.noSectionsBody")}</p>
              </div>
            )
          ) : modulesEnabled && course!.modules.length > 0 && (
            <div className="space-y-4">
              {course!.modules.map((m, mi) => (
                <div key={m.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("courseDetailPage.labels.moduleNumber", { count: mi + 1 })}</p>
                      <h4 className="font-black text-base">{m.title}</h4>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setLessonModalFor({ moduleId: m.id })} aria-label={t("courseDetailPage.aria.addLessonToModule")} className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted">
                        <Plus className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => { deleteModule(courseId, m.id); toast.success(t("courseDetailPage.toast.moduleRemoved")); }} aria-label={t("courseDetailPage.aria.deleteModule")} className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {m.lessons.length === 0 ? (
                    <p className="text-xs text-foreground/60 italic">{t("courseDetailPage.empty.noModuleLessons")}</p>
                  ) : (
                    <LessonList lessons={m.lessons} onDelete={(id) => { deleteLesson(courseId, id, m.id); toast.success(t("courseDetailPage.toast.lessonRemoved")); }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {!backendEnabled && (course!.lessons.length > 0 || (!modulesEnabled && course!.modules.length === 0)) && (
            <div className="space-y-2">
              {modulesEnabled && course!.modules.length > 0 && course!.lessons.length > 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("courseDetailPage.labels.ungrouped")}</p>
              )}
              {course!.lessons.length === 0 && course!.modules.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
                  <p className="font-bold">{t("courseDetailPage.empty.noContentTitle")}</p>
                  <p className="text-sm text-foreground/60">{modulesEnabled ? t("courseDetailPage.empty.noContentWithModules") : t("courseDetailPage.empty.noContentNoModules")}</p>
                </div>
              ) : (
                <LessonList lessons={course!.lessons} onDelete={(id) => { deleteLesson(courseId, id); toast.success(t("courseDetailPage.toast.lessonRemoved")); }} />
              )}
            </div>
          )}
        </section>
      )}

      {lessonModalFor && (
        <Modal onClose={() => setLessonModalFor(null)}>
          <form onSubmit={submitLesson} className="space-y-4">
            <ModalHeader title={backendEnabled ? t("courseDetailPage.modal.addLessonToSection") : lessonModalFor.moduleId ? t("courseDetailPage.modal.addLessonToModule") : t("courseDetailPage.modal.addLesson")} onClose={() => setLessonModalFor(null)} />
            <Field label={t("courseDetailPage.modal.titleField")}>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("courseDetailPage.modal.lessonTitlePlaceholder")} className={inputCls} />
            </Field>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{t("courseDetailPage.modal.typeField")}</span>
              <div className={`grid ${lessonTypesResolved.length > 4 ? "grid-cols-5" : "grid-cols-4"} gap-2`}>
                {lessonTypesResolved.map(({ type, label, icon: Icon }) => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 cursor-pointer transition-colors ${form.type === type ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-foreground/70"}`}>
                    <Icon className="size-4" />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label={t("courseDetailPage.modal.durationField")}>
              <input type="number" min={0} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} placeholder={t("courseDetailPage.modal.durationPlaceholder")} className={inputCls} />
            </Field>
            <ModalActions onCancel={() => setLessonModalFor(null)} submitLabel={t("courseDetailPage.actions.addLesson")} />
          </form>
        </Modal>
      )}

      {moduleOpen && (
        <Modal onClose={() => setModuleOpen(false)}>
          <form onSubmit={submitModule} className="space-y-4">
            <ModalHeader title={backendEnabled ? t("courseDetailPage.modal.addSection") : t("courseDetailPage.modal.addModule")} onClose={() => setModuleOpen(false)} />
            <Field label={backendEnabled ? t("courseDetailPage.modal.sectionTitleField") : t("courseDetailPage.modal.moduleTitleField")}>
              <input autoFocus value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder={backendEnabled ? t("courseDetailPage.modal.sectionTitlePlaceholder") : t("courseDetailPage.modal.moduleTitlePlaceholder")} className={inputCls} />
            </Field>
            <ModalActions onCancel={() => setModuleOpen(false)} submitLabel={backendEnabled ? t("courseDetailPage.actions.addSection") : t("courseDetailPage.actions.addModule")} />
          </form>
        </Modal>
      )}

      {backendEnabled && isVideoType && backendCourseId !== null && (
        <section className="space-y-4 mt-6">
          <h3 className="text-lg font-black">{t("courseDetailPage.sections.enrolledStudents")}</h3>
          {enrolledStudentsQuery.isLoading ? (
            <p className="text-sm text-foreground/50">{t("courseDetailPage.state.loadingStudents")}</p>
          ) : (enrolledStudentsQuery.data ?? []).length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">{t("courseDetailPage.empty.noEnrolledStudentsTitle")}</p>
              <p className="text-sm text-foreground/60">{t("courseDetailPage.empty.noEnrolledStudentsBody")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(enrolledStudentsQuery.data ?? []).map((student) => (
                <div key={student.userId} className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl p-3">
                  <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{student.fullName ?? student.email}</p>
                    <p className="text-xs text-foreground/60 truncate">{student.fullName ? student.email : ""}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide ${
                    student.enrollmentStatus === "active" ? "border-green-400/40 bg-green-400/5 text-green-700 dark:text-green-400" : "border-border bg-muted text-foreground/50"
                  }`}>{t(`courseDetailPage.enrollmentStatus.${student.enrollmentStatus}`, { defaultValue: student.enrollmentStatus })}</span>
                  <button
                    type="button"
                    aria-label={t("courseDetailPage.aria.unenrollStudent")}
                    disabled={unenrollMutation.isPending}
                    onClick={async () => {
                      try {
                        await unenrollMutation.mutateAsync({ courseId: backendCourseId, userId: student.userId });
                        toast.success(t("courseDetailPage.toast.studentUnenrolled"));
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : t("courseDetailPage.toast.unenrollFailed"));
                      }
                    }}
                    className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserMinus className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {curriculumOpen && <CurriculumImportDialog courseId={courseId} onClose={() => setCurriculumOpen(false)} />}
      {placementOpen && <PlacementTestDialog courseId={courseId} onClose={() => setPlacementOpen(false)} />}
      {enrollOpen && <EnrollIndividualDialog courseId={courseId} onClose={() => setEnrollOpen(false)} />}
      {createGroupOpen && backendCourseId !== null && (
        <CreateGroupDialog
          courseId={backendCourseId}
          courseTitle={backendCourse?.title}
          onClose={() => setCreateGroupOpen(false)}
        />
      )}
      {individualGroupOpen && backendCourseId !== null && (
        <IndividualGroupDialog
          courseId={backendCourseId}
          courseTitle={backendCourse?.title}
          onClose={() => setIndividualGroupOpen(false)}
        />
      )}
      {videoEnrollOpen && backendCourseId !== null && (
        <VideoEnrollDialog
          courseId={backendCourseId}
          courseTitle={backendCourse?.title}
          onClose={() => setVideoEnrollOpen(false)}
        />
      )}
    </DashboardShell>
  );
}

function LessonList({ lessons, onDelete }: { lessons: { id: string; title: string; type: LessonType; durationMin?: number }[]; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
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
              <p className="text-xs text-foreground/60 capitalize">{t(`courseDetailPage.lessonTypes.${l.type}`, { defaultValue: l.type })}{l.durationMin ? ` · ${t("courseDetailPage.labels.minutesShort", { count: l.durationMin })}` : ""}</p>
            </div>
            <button type="button" onClick={() => onDelete(l.id)} aria-label={t("courseDetailPage.aria.deleteLesson")} className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function BackendLessonList({ lessons }: { lessons: Array<{ id: number; title: string; kind?: string; duration?: number }> }) {
  const { t } = useTranslation();
  return (
    <ol className="space-y-2">
      {lessons.map((lesson, index) => {
        const mappedType = mapBackendKindToLessonType(lesson.kind);
        const Icon = iconFor(mappedType);
        return (
          <li key={lesson.id} className="flex items-center gap-3 bg-background border-2 border-border rounded-2xl p-3">
            <div className="size-7 grid place-items-center rounded-lg bg-muted text-foreground/70 text-xs font-black">{index + 1}</div>
            <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{lesson.title}</p>
              <p className="text-xs text-foreground/60 capitalize">{t(`courseDetailPage.lessonTypes.${mappedType}`, { defaultValue: lesson.kind ?? t("courseDetailPage.labels.lesson") })}{lesson.duration ? ` · ${t("courseDetailPage.labels.minutesShort", { count: Math.round(lesson.duration / 60) })}` : ""}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function mapLessonTypeToBackendKind(type: LessonType): "video" | "article" | "quiz" | "code" {
  if (type === "video") return "video";
  if (type === "quiz") return "quiz";
  if (type === "assignment") return "code";
  return "article";
}

function mapBackendKindToLessonType(kind?: string): LessonType {
  if (kind === "video") return "video";
  if (kind === "quiz") return "quiz";
  if (kind === "code") return "assignment";
  return "reading";
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">{t("courseDetailPage.actions.cancel")}</button>
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
