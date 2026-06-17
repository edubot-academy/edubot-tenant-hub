import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookMarked, BookOpen, Calendar, CheckCircle2, ClipboardList, FolderOpen, Plus, Radio, Save, Trash2, Users, X } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useRole } from "@/lib/roles";
import {
  type AcademicSessionActivityRecord,
  type AcademicSessionHomeworkRecord,
  type ActivityType,
  type ActivityPayload,
  type VocabularyPayload,
  type FillBlankPayload,
  type WordMatchPayload,
  type ListeningPayload,
  type WritingCorrectionPayload,
  type LessonPlanTemplateRecord,
  useAcademicClass,
  useAcademicClassStudents,
  useAcademicClassTimetable,
  useAcademicSession,
  useAcademicSessionActivities,
  useAcademicSessionActivityResponses,
  useAcademicSessionAttendance,
  useAcademicSessionHomework,
  useAcademicSessionHomeworkSubmissions,
  useCreateAcademicSessionActivity,
  useCreateAcademicSessionHomework,
  useMarkAcademicSessionAttendance,
  useReviewAcademicSessionActivitySubmission,
  useReviewAcademicSessionHomeworkSubmission,
  useUpdateAcademicSession,
  useUpdateAcademicSessionActivity,
  useUpdateAcademicSessionHomework,
  useLessonPlanTemplates,
  useCreateLessonPlanTemplate,
} from "@/lib/lms-core-api";

export const Route = createFileRoute("/classes/$classId/sessions/$sessionId")({
  head: () => ({ meta: [{ title: "QuestLMS — Academic Session" }] }),
  component: AcademicSessionDetailPage,
});

function AcademicSessionDetailPage() {
  const { classId, sessionId } = Route.useParams();
  const numericClassId = Number(classId);
  const numericSessionId = Number(sessionId);
  const { role } = useRole();
  const canManage = role === "company_admin" || role === "owner" || role === "instructor";

  const classQuery = useAcademicClass(Number.isFinite(numericClassId) ? numericClassId : null);
  const studentsQuery = useAcademicClassStudents(Number.isFinite(numericClassId) ? numericClassId : null);
  const timetableQuery = useAcademicClassTimetable(Number.isFinite(numericClassId) ? numericClassId : null);
  const sessionDirectQuery = useAcademicSession(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const attendanceQuery = useAcademicSessionAttendance(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const homeworkQuery = useAcademicSessionHomework(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const activitiesQuery = useAcademicSessionActivities(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const markAttendanceMutation = useMarkAcademicSessionAttendance(
    Number.isFinite(numericSessionId) ? numericSessionId : null,
    Number.isFinite(numericClassId) ? numericClassId : null,
  );
  const createHomeworkMutation = useCreateAcademicSessionHomework(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const createActivityMutation = useCreateAcademicSessionActivity(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const updateHomeworkMutation = useUpdateAcademicSessionHomework(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const updateActivityMutation = useUpdateAcademicSessionActivity(Number.isFinite(numericSessionId) ? numericSessionId : null);
  const updateSessionMutation = useUpdateAcademicSession(Number.isFinite(numericClassId) ? numericClassId : null);
  const templatesQuery = useLessonPlanTemplates();
  const createTemplateMutation = useCreateLessonPlanTemplate();

  const session = useMemo(
    () =>
      (timetableQuery.data?.items ?? []).find((item) => item.id === numericSessionId) ??
      sessionDirectQuery.data ??
      null,
    [timetableQuery.data?.items, numericSessionId, sessionDirectQuery.data],
  );
  const roster = useMemo(
    () => (studentsQuery.data?.items ?? []).filter((item) => item.status === "active"),
    [studentsQuery.data?.items],
  );

  const [attendanceDraft, setAttendanceDraft] = useState<Record<number, "present" | "absent" | "late" | "excused">>({});
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedHomework, setSelectedHomework] = useState<AcademicSessionHomeworkRecord | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<AcademicSessionActivityRecord | null>(null);
  const [homeworkReviewTarget, setHomeworkReviewTarget] = useState<AcademicSessionHomeworkRecord | null>(null);
  const [activityReviewTarget, setActivityReviewTarget] = useState<AcademicSessionActivityRecord | null>(null);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [homeworkDueAt, setHomeworkDueAt] = useState("");
  const [homeworkMaxScore, setHomeworkMaxScore] = useState("");
  const [homeworkPublished, setHomeworkPublished] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("discussion");
  const [activityStatus, setActivityStatus] = useState<"planned" | "active" | "done">("planned");
  const [activityPayload, setActivityPayload] = useState<ActivityPayload>(null);
  type ReviewState = { status: "approved" | "rejected" | "needs_revision"; score: string; comment: string };
  const DEFAULT_REVIEW: ReviewState = { status: "approved", score: "", comment: "" };
  const [reviewStates, setReviewStates] = useState<Record<number, ReviewState>>({});
  const getReview = (id: number): ReviewState => reviewStates[id] ?? DEFAULT_REVIEW;
  const setReview = (id: number, patch: Partial<ReviewState>) =>
    setReviewStates((prev) => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_REVIEW), ...patch } }));
  const homeworkSubmissionsQuery = useAcademicSessionHomeworkSubmissions(
    Number.isFinite(numericSessionId) ? numericSessionId : null,
    homeworkReviewTarget?.id ?? null,
  );
  const activityResponsesQuery = useAcademicSessionActivityResponses(
    Number.isFinite(numericSessionId) ? numericSessionId : null,
    activityReviewTarget?.id ?? null,
  );
  const reviewHomeworkSubmissionMutation = useReviewAcademicSessionHomeworkSubmission(
    Number.isFinite(numericSessionId) ? numericSessionId : null,
    homeworkReviewTarget?.id ?? null,
  );
  const reviewActivitySubmissionMutation = useReviewAcademicSessionActivitySubmission(
    Number.isFinite(numericSessionId) ? numericSessionId : null,
    activityReviewTarget?.id ?? null,
  );

  useEffect(() => {
    const nextDraft: Record<number, "present" | "absent" | "late" | "excused"> = {};
    const existing = new Map((attendanceQuery.data?.items ?? []).map((item) => [item.userId, item.status]));
    for (const item of roster) {
      nextDraft[item.studentId] = existing.get(item.studentId) ?? "present";
    }
    setAttendanceDraft(nextDraft);
  }, [attendanceQuery.data?.items, roster]);

  const saveAttendance = async () => {
    try {
      await markAttendanceMutation.mutateAsync(
        roster.map((item) => ({
          studentId: item.studentId,
          status: attendanceDraft[item.studentId] ?? "present",
        })),
      );
      toast.success("Attendance saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save attendance");
    }
  };

  const submitHomework = async () => {
    if (!homeworkTitle.trim()) {
      toast.error("Homework title is required");
      return;
    }
    try {
      const payload = {
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim() || null,
        dueAt: homeworkDueAt ? new Date(homeworkDueAt).toISOString() : null,
        maxScore: homeworkMaxScore ? Number(homeworkMaxScore) : null,
        isPublished: homeworkPublished,
      };
      if (selectedHomework) {
        await updateHomeworkMutation.mutateAsync({ homeworkId: selectedHomework.id, patch: payload });
      } else {
        await createHomeworkMutation.mutateAsync(payload);
      }
      setHomeworkTitle("");
      setHomeworkDescription("");
      setHomeworkDueAt("");
      setHomeworkMaxScore("");
      setHomeworkPublished(false);
      setSelectedHomework(null);
      setHomeworkDialogOpen(false);
      toast.success(selectedHomework ? "Homework updated" : "Homework created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save homework");
    }
  };

  const submitActivity = async () => {
    if (!activityTitle.trim()) {
      toast.error("Activity title is required");
      return;
    }
    try {
      const activityData = {
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        type: activityType,
        status: activityStatus,
        payload: activityPayload,
      };
      if (selectedActivity) {
        await updateActivityMutation.mutateAsync({ activityId: selectedActivity.id, patch: activityData });
      } else {
        await createActivityMutation.mutateAsync(activityData);
      }
      setActivityTitle("");
      setActivityDescription("");
      setActivityType("discussion");
      setActivityStatus("planned");
      setActivityPayload(null);
      setSelectedActivity(null);
      setActivityDialogOpen(false);
      toast.success(selectedActivity ? "Activity updated" : "Activity created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save activity");
    }
  };

  const openHomeworkEditor = (item?: AcademicSessionHomeworkRecord) => {
    setSelectedHomework(item ?? null);
    setHomeworkTitle(item?.title ?? "");
    setHomeworkDescription(item?.description ?? "");
    setHomeworkDueAt(toDateTimeLocalValue(item?.dueAt));
    setHomeworkMaxScore(item?.maxScore != null ? String(item.maxScore) : "");
    setHomeworkPublished(item?.isPublished ?? false);
    setHomeworkDialogOpen(true);
  };

  const openActivityEditor = (item?: AcademicSessionActivityRecord) => {
    setSelectedActivity(item ?? null);
    setActivityTitle(item?.title ?? "");
    setActivityDescription(item?.description ?? "");
    setActivityType(item?.type ?? "discussion");
    setActivityStatus(item?.status ?? "planned");
    setActivityPayload(item?.payload ?? null);
    setActivityDialogOpen(true);
  };

  const openHomeworkReview = (item: AcademicSessionHomeworkRecord) => {
    setHomeworkReviewTarget(item);
    setReviewStates({});
  };

  const openActivityReview = (item: AcademicSessionActivityRecord) => {
    setActivityReviewTarget(item);
    setReviewStates({});
  };

  const submitHomeworkReview = async (submissionId: number) => {
    const review = getReview(submissionId);
    try {
      await reviewHomeworkSubmissionMutation.mutateAsync({
        submissionId,
        status: review.status,
        score: review.score ? Number(review.score) : null,
        reviewComment: review.comment.trim() || null,
      });
      toast.success("Homework review saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save homework review");
    }
  };

  const submitActivityReview = async (submissionId: number) => {
    const review = getReview(submissionId);
    try {
      await reviewActivitySubmissionMutation.mutateAsync({
        submissionId,
        status: review.status,
        score: review.score ? Number(review.score) : null,
        reviewComment: review.comment.trim() || null,
      });
      toast.success("Activity review saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save activity review");
    }
  };

  const toggleMakeup = async (checked: boolean) => {
    if (!session) return;
    try {
      await updateSessionMutation.mutateAsync({ sessionId: session.id, patch: { isMakeup: checked } });
      toast.success(checked ? "Marked as makeup session" : "Makeup flag removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update session");
    }
  };

  const handleLoadTemplate = async (template: LessonPlanTemplateRecord) => {
    setTemplatePickerOpen(false);
    try {
      for (const activity of template.activities) {
        await createActivityMutation.mutateAsync({
          title: activity.title,
          description: activity.description ?? null,
          type: activity.type as ActivityType,
          status: "planned",
          payload: activity.payload ?? null,
        });
      }
      toast.success(`Loaded "${template.name}" (${template.activities.length} activities)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load template");
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    const activities = activitiesQuery.data ?? [];
    if (activities.length === 0) {
      toast.error("No activities to save");
      return;
    }
    try {
      await createTemplateMutation.mutateAsync({
        name: templateName.trim(),
        activities: activities.map((a) => ({
          type: a.type,
          title: a.title,
          description: a.description ?? null,
          payload: a.payload ?? null,
        })),
      });
      toast.success(`Template "${templateName.trim()}" saved`);
      setTemplateName("");
      setSaveTemplateDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={session?.title ?? "Academic session"}
        subtitle={classQuery.data?.name ? `${classQuery.data.name} · Session workspace` : "Attendance, homework, and activities."}
        showStreak={false}
      />

      <Link to="/classes/$classId" params={{ classId }} className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to class
      </Link>

      {!session ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold text-destructive">Session not found</p>
          <p className="text-sm text-foreground/60">This academic session could not be loaded from the current class timetable.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={<Calendar className="size-4" />} label="Starts" value={formatDateTime(session.startsAt)} />
            <StatCard icon={<Users className="size-4" />} label="Roster" value={String(roster.length)} />
            <StatCard icon={<BookOpen className="size-4" />} label="Subject" value={session.course?.title ?? `Course #${session.courseId}`} />
          </div>

          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{session.status}</p>
                <h3 className="text-lg font-black">{session.title}</h3>
              </div>
              {session.location ? <span className="rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground/70">{session.location}</span> : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground/70">
              <div><span className="font-bold text-foreground">Starts:</span> {new Date(session.startsAt).toLocaleString()}</div>
              <div><span className="font-bold text-foreground">Ends:</span> {new Date(session.endsAt).toLocaleString()}</div>
              {session.instructor?.fullName || session.instructor?.email ? (
                <div><span className="font-bold text-foreground">Instructor:</span> {session.instructor?.fullName ?? session.instructor?.email}</div>
              ) : null}
              {session.liveJoinUrl ? (
                <div className="truncate"><span className="font-bold text-foreground">Join:</span> {session.liveJoinUrl}</div>
              ) : null}
            </div>
            {canManage ? (
              <div className="pt-2 border-t border-border">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={session.isMakeup ?? false}
                    onChange={(e) => toggleMakeup(e.target.checked)}
                    className="rounded"
                  />
                  <BookMarked className="size-3.5 text-foreground/50" />
                  Makeup session
                </label>
              </div>
            ) : session.isMakeup ? (
              <div className="pt-2 border-t border-border">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                  <BookMarked className="size-3" /> Makeup session
                </span>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <h3 className="text-lg font-black">Attendance</h3>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={saveAttendance}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                >
                  Save attendance
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border-2 border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b-2 border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 w-8">#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">Student</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((item, index) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-foreground/40">{index + 1}</td>
                      <td className="px-4 py-3 font-bold">{item.student?.fullName ?? item.student?.email ?? `Student #${item.studentId}`}</td>
                      <td className="px-4 py-3 text-xs text-foreground/60 hidden sm:table-cell">{item.student?.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={attendanceDraft[item.studentId] ?? "present"}
                          onChange={(event) =>
                            setAttendanceDraft((current) => ({
                              ...current,
                              [item.studentId]: event.target.value as "present" | "absent" | "late" | "excused",
                            }))
                          }
                          disabled={!canManage}
                          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none disabled:opacity-70"
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                <h3 className="text-lg font-black">Homework</h3>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => openHomeworkEditor()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                >
                  <Plus className="size-4" strokeWidth={3} /> New homework
                </button>
              ) : null}
            </div>

            {(homeworkQuery.data ?? []).length === 0 ? (
              <EmptyState text="No homework has been created for this session yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(homeworkQuery.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-sm">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/60">
                          {item.isPublished ? "published" : "draft"}
                        </span>
                        {canManage ? (
                          <>
                            <button type="button" onClick={() => openHomeworkEditor(item)} className="rounded-lg border-2 border-border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70 hover:bg-muted">
                              Edit
                            </button>
                            <button type="button" onClick={() => openHomeworkReview(item)} className="rounded-lg border-2 border-border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70 hover:bg-muted">
                              Reviews
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {item.description ? <p className="text-sm text-foreground/60">{item.description}</p> : null}
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-foreground/60">
                      <span>Due {item.dueAt ? new Date(item.dueAt).toLocaleString() : "Not set"}</span>
                      <span>Max score {item.maxScore ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-primary" />
                <h3 className="text-lg font-black">Activities</h3>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTemplatePickerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"
                  >
                    <FolderOpen className="size-4" /> Load plan
                  </button>
                  {(activitiesQuery.data ?? []).length > 0 ? (
                    <button
                      type="button"
                      onClick={() => { setTemplateName(""); setSaveTemplateDialogOpen(true); }}
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"
                    >
                      <Save className="size-4" /> Save as template
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openActivityEditor()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                  >
                    <Plus className="size-4" strokeWidth={3} /> New activity
                  </button>
                </div>
              ) : null}
            </div>

            {(activitiesQuery.data ?? []).length === 0 ? (
              <EmptyState text="No activities have been created for this session yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activitiesQuery.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-sm">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/60">
                          {ACTIVITY_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        {canManage ? (
                          <>
                            <button type="button" onClick={() => openActivityEditor(item)} className="rounded-lg border-2 border-border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70 hover:bg-muted">
                              Edit
                            </button>
                            <button type="button" onClick={() => openActivityReview(item)} className="rounded-lg border-2 border-border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/70 hover:bg-muted">
                              Responses
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {item.description ? <p className="text-sm text-foreground/60">{item.description}</p> : null}
                    <div className="text-xs font-bold text-foreground/60">Status {item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {homeworkDialogOpen ? (
        <DialogShell title={selectedHomework ? "Edit homework" : "Create homework"} onClose={() => setHomeworkDialogOpen(false)}>
          <div className="space-y-4">
            <FormField label="Title">
              <input value={homeworkTitle} onChange={(event) => setHomeworkTitle(event.target.value)} className={inputClassName} />
            </FormField>
            <FormField label="Description">
              <textarea value={homeworkDescription} onChange={(event) => setHomeworkDescription(event.target.value)} rows={3} className={inputClassName} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Due at">
                <input type="datetime-local" value={homeworkDueAt} onChange={(event) => setHomeworkDueAt(event.target.value)} className={inputClassName} />
              </FormField>
              <FormField label="Max score">
                <input type="number" min="0" value={homeworkMaxScore} onChange={(event) => setHomeworkMaxScore(event.target.value)} className={inputClassName} />
              </FormField>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
              <input type="checkbox" checked={homeworkPublished} onChange={(event) => setHomeworkPublished(event.target.checked)} />
              Publish immediately
            </label>
            <DialogActions onCancel={() => setHomeworkDialogOpen(false)} onConfirm={submitHomework} confirmLabel={selectedHomework ? "Save homework" : "Create homework"} />
          </div>
        </DialogShell>
      ) : null}

      {activityDialogOpen ? (
        <DialogShell title={selectedActivity ? "Edit activity" : "Create activity"} onClose={() => setActivityDialogOpen(false)}>
          <div className="space-y-4">
            <FormField label="Title">
              <input value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} className={inputClassName} />
            </FormField>
            <FormField label="Description">
              <textarea value={activityDescription} onChange={(event) => setActivityDescription(event.target.value)} rows={3} className={inputClassName} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Type">
                <select
                  value={activityType}
                  onChange={(event) => {
                    const next = event.target.value as ActivityType;
                    setActivityType(next);
                    setActivityPayload(
                      next === "vocabulary" ? { words: [] } :
                      next === "fill_blank" ? { sentences: [] } :
                      next === "word_match" ? { pairs: [] } :
                      next === "listening" ? { audioUrl: "", questions: [] } :
                      next === "writing_correction" ? { prompt: "", rubric: null } : null
                    );
                  }}
                  className={inputClassName}
                >
                  <option value="discussion">Discussion</option>
                  <option value="exercise">Exercise</option>
                  <option value="quiz">Quiz</option>
                  <option value="group_work">Group work</option>
                  <option disabled>──────────</option>
                  <option value="vocabulary">Vocabulary list</option>
                  <option value="fill_blank">Fill in the blank</option>
                  <option value="word_match">Word match</option>
                  <option value="listening">Listening</option>
                  <option value="writing_correction">Writing correction</option>
                </select>
              </FormField>
              <FormField label="Status">
                <select value={activityStatus} onChange={(event) => setActivityStatus(event.target.value as "planned" | "active" | "done")} className={inputClassName}>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="done">Done</option>
                </select>
              </FormField>
            </div>

            {activityType === "vocabulary" && (
              <VocabularyEditor
                payload={activityPayload as VocabularyPayload | null}
                onChange={(p) => setActivityPayload(p)}
              />
            )}
            {activityType === "fill_blank" && (
              <FillBlankEditor
                payload={activityPayload as FillBlankPayload | null}
                onChange={(p) => setActivityPayload(p)}
              />
            )}
            {activityType === "word_match" && (
              <WordMatchEditor
                payload={activityPayload as WordMatchPayload | null}
                onChange={(p) => setActivityPayload(p)}
              />
            )}
            {activityType === "listening" && (
              <ListeningEditor
                payload={activityPayload as ListeningPayload | null}
                onChange={(p) => setActivityPayload(p)}
              />
            )}
            {activityType === "writing_correction" && (
              <WritingCorrectionEditor
                payload={activityPayload as WritingCorrectionPayload | null}
                onChange={(p) => setActivityPayload(p)}
              />
            )}

            <DialogActions onCancel={() => setActivityDialogOpen(false)} onConfirm={submitActivity} confirmLabel={selectedActivity ? "Save activity" : "Create activity"} />
          </div>
        </DialogShell>
      ) : null}

      {homeworkReviewTarget ? (
        <DialogShell title={`Homework reviews · ${homeworkReviewTarget.title}`} onClose={() => setHomeworkReviewTarget(null)}>
          <div className="space-y-4">
            {(homeworkSubmissionsQuery.data ?? []).length === 0 ? (
              <EmptyState text="No student submissions yet." />
            ) : (
              (homeworkSubmissionsQuery.data ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border-2 border-border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-sm">{item.student?.fullName ?? item.student?.email ?? `Student #${item.studentId}`}</p>
                      <p className="text-xs text-foreground/60">{item.status} · {formatDateTime(item.updatedAt)}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground/60">Score {item.score ?? "—"}</span>
                  </div>
                  {item.answerText ? <p className="text-sm text-foreground/70">{item.answerText}</p> : null}
                  {item.attachmentUrl ? <p className="text-xs text-foreground/60 break-all">{item.attachmentUrl}</p> : null}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Status">
                      <select value={getReview(item.id).status} onChange={(event) => setReview(item.id, { status: event.target.value as "approved" | "rejected" | "needs_revision" })} className={inputClassName}>
                        <option value="approved">Approved</option>
                        <option value="needs_revision">Needs revision</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormField>
                    <FormField label="Score">
                      <input value={getReview(item.id).score} onChange={(event) => setReview(item.id, { score: event.target.value })} type="number" min="0" className={inputClassName} />
                    </FormField>
                    <FormField label="Review comment">
                      <input value={getReview(item.id).comment} onChange={(event) => setReview(item.id, { comment: event.target.value })} className={inputClassName} />
                    </FormField>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => submitHomeworkReview(item.id)} className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90">
                      Save review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogShell>
      ) : null}

      {activityReviewTarget ? (
        <DialogShell title={`Activity responses · ${activityReviewTarget.title}`} onClose={() => setActivityReviewTarget(null)}>
          <div className="space-y-4">
            {activityResponsesQuery.data?.mode === "quiz" ? (
              (activityResponsesQuery.data.items ?? []).length === 0 ? (
                <EmptyState text="No quiz attempts yet." />
              ) : (
                (activityResponsesQuery.data.items ?? []).map((item) => (
                  <div key={item.latestAttemptId} className="rounded-2xl border-2 border-border bg-background p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-sm">{item.studentName}</p>
                      <span className="text-xs font-bold text-foreground/60">{item.score}% · {item.passed ? "passed" : "not passed"}</span>
                    </div>
                    <p className="text-xs text-foreground/60">{item.attemptsCount} attempt(s) · {formatDateTime(item.submittedAt)}</p>
                  </div>
                ))
              )
            ) : (activityResponsesQuery.data?.items ?? []).length === 0 ? (
              <EmptyState text="No student responses yet." />
            ) : (
              (activityResponsesQuery.data?.items ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border-2 border-border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-sm">{item.student?.fullName ?? item.student?.email ?? `Student #${item.studentId}`}</p>
                      <p className="text-xs text-foreground/60">{item.status} · {formatDateTime(item.updatedAt)}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground/60">Score {item.score ?? "—"}</span>
                  </div>
                  {item.answerText ? <p className="text-sm text-foreground/70">{item.answerText}</p> : null}
                  {item.attachmentUrl ? <p className="text-xs text-foreground/60 break-all">{item.attachmentUrl}</p> : null}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Status">
                      <select value={getReview(item.id).status} onChange={(event) => setReview(item.id, { status: event.target.value as "approved" | "rejected" | "needs_revision" })} className={inputClassName}>
                        <option value="approved">Approved</option>
                        <option value="needs_revision">Needs revision</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormField>
                    <FormField label="Score">
                      <input value={getReview(item.id).score} onChange={(event) => setReview(item.id, { score: event.target.value })} type="number" min="0" className={inputClassName} />
                    </FormField>
                    <FormField label="Review comment">
                      <input value={getReview(item.id).comment} onChange={(event) => setReview(item.id, { comment: event.target.value })} className={inputClassName} />
                    </FormField>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => submitActivityReview(item.id)} className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90">
                      Save review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogShell>
      ) : null}
      {templatePickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-black">Load lesson plan</h3>
              <button type="button" onClick={() => setTemplatePickerOpen(false)} className="size-9 rounded-xl border-2 border-border hover:bg-muted grid place-items-center">
                <X className="size-4" />
              </button>
            </div>
            {(templatesQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-foreground/60 text-center py-4">No saved lesson plan templates yet. Create activities and save them as a template first.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(templatesQuery.data ?? []).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleLoadTemplate(template)}
                    className="cursor-pointer w-full text-left rounded-2xl border-2 border-border bg-background hover:border-primary p-4 space-y-1 transition-colors"
                  >
                    <p className="font-black text-sm">{template.name}</p>
                    <p className="text-xs text-foreground/60">{template.activities.length} activities · {new Date(template.createdAt).toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.activities.slice(0, 4).map((a, i) => (
                        <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground/60">
                          {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                        </span>
                      ))}
                      {template.activities.length > 4 ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground/60">+{template.activities.length - 4} more</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {saveTemplateDialogOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center">
          <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">Save as template</h3>
              <button type="button" onClick={() => setSaveTemplateDialogOpen(false)} className="size-9 rounded-xl border-2 border-border hover:bg-muted grid place-items-center">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-foreground/60">Saves all {activitiesQuery.data?.length ?? 0} current activities as a reusable lesson plan template.</p>
            <FormField label="Template name">
              <input
                autoFocus
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. B1 Speaking — Unit 3"
                className={inputClassName}
              />
            </FormField>
            <DialogActions onCancel={() => setSaveTemplateDialogOpen(false)} onConfirm={handleSaveTemplate} confirmLabel="Save template" />
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  discussion: "Discussion",
  exercise: "Exercise",
  quiz: "Quiz",
  group_work: "Group work",
  vocabulary: "Vocabulary",
  fill_blank: "Fill blank",
  word_match: "Word match",
  listening: "Listening",
  writing_correction: "Writing correction",
};

function VocabularyEditor({
  payload,
  onChange,
}: {
  payload: VocabularyPayload | null;
  onChange: (p: VocabularyPayload) => void;
}) {
  const words = payload?.words ?? [];

  const addWord = () =>
    onChange({ words: [...words, { term: "", definition: "", exampleSentence: "", translation: "" }] });

  const updateWord = (index: number, patch: Partial<VocabularyPayload["words"][0]>) =>
    onChange({ words: words.map((w, i) => (i === index ? { ...w, ...patch } : w)) });

  const removeWord = (index: number) =>
    onChange({ words: words.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-foreground/60">Words ({words.length})</span>
        <button type="button" onClick={addWord} className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Plus className="size-3.5" strokeWidth={3} /> Add word
        </button>
      </div>
      {words.length === 0 && (
        <p className="text-xs text-foreground/50 italic">No words yet — click "Add word"</p>
      )}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {words.map((word, index) => (
          <div key={index} className="rounded-2xl border-2 border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Word {index + 1}</span>
              <button type="button" onClick={() => removeWord(index)} className="cursor-pointer size-6 grid place-items-center rounded-md hover:bg-muted text-foreground/60">
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={word.term}
                onChange={(e) => updateWord(index, { term: e.target.value })}
                placeholder="Term (e.g. Hello)"
                className={inputClassName + " text-xs"}
              />
              <input
                value={word.translation ?? ""}
                onChange={(e) => updateWord(index, { translation: e.target.value })}
                placeholder="Translation"
                className={inputClassName + " text-xs"}
              />
            </div>
            <input
              value={word.definition}
              onChange={(e) => updateWord(index, { definition: e.target.value })}
              placeholder="Definition"
              className={inputClassName + " text-xs"}
            />
            <input
              value={word.exampleSentence ?? ""}
              onChange={(e) => updateWord(index, { exampleSentence: e.target.value })}
              placeholder="Example sentence (optional)"
              className={inputClassName + " text-xs"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FillBlankEditor({
  payload,
  onChange,
}: {
  payload: FillBlankPayload | null;
  onChange: (p: FillBlankPayload) => void;
}) {
  const sentences = payload?.sentences ?? [];

  const addSentence = () =>
    onChange({ sentences: [...sentences, { template: "", answers: [] }] });

  const updateTemplate = (index: number, template: string) =>
    onChange({ sentences: sentences.map((s, i) => (i === index ? { ...s, template } : s)) });

  const updateAnswers = (index: number, answersRaw: string) =>
    onChange({
      sentences: sentences.map((s, i) =>
        i === index ? { ...s, answers: answersRaw.split(",").map((a) => a.trim()).filter(Boolean) } : s,
      ),
    });

  const removeSentence = (index: number) =>
    onChange({ sentences: sentences.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-foreground/60">Sentences ({sentences.length})</span>
        <button type="button" onClick={addSentence} className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Plus className="size-3.5" strokeWidth={3} /> Add sentence
        </button>
      </div>
      <p className="text-[10px] text-foreground/50">Use <code className="bg-muted px-1 rounded">___</code> to mark blanks in the template.</p>
      {sentences.length === 0 && (
        <p className="text-xs text-foreground/50 italic">No sentences yet — click "Add sentence"</p>
      )}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {sentences.map((sentence, index) => (
          <div key={index} className="rounded-2xl border-2 border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Sentence {index + 1}</span>
              <button type="button" onClick={() => removeSentence(index)} className="cursor-pointer size-6 grid place-items-center rounded-md hover:bg-muted text-foreground/60">
                <Trash2 className="size-3" />
              </button>
            </div>
            <input
              value={sentence.template}
              onChange={(e) => updateTemplate(index, e.target.value)}
              placeholder="The cat sat on the ___."
              className={inputClassName + " text-xs"}
            />
            <input
              value={sentence.answers.join(", ")}
              onChange={(e) => updateAnswers(index, e.target.value)}
              placeholder="Accepted answers, comma-separated (e.g. mat, rug)"
              className={inputClassName + " text-xs"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function WordMatchEditor({
  payload,
  onChange,
}: {
  payload: WordMatchPayload | null;
  onChange: (p: WordMatchPayload) => void;
}) {
  const pairs = payload?.pairs ?? [];

  const addPair = () =>
    onChange({ pairs: [...pairs, { term: "", match: "" }] });

  const updatePair = (index: number, patch: Partial<WordMatchPayload["pairs"][0]>) =>
    onChange({ pairs: pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)) });

  const removePair = (index: number) =>
    onChange({ pairs: pairs.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-foreground/60">Pairs ({pairs.length})</span>
        <button type="button" onClick={addPair} className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Plus className="size-3.5" strokeWidth={3} /> Add pair
        </button>
      </div>
      {pairs.length === 0 && (
        <p className="text-xs text-foreground/50 italic">No pairs yet — click "Add pair"</p>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {pairs.map((pair, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
            <input
              value={pair.term}
              onChange={(e) => updatePair(index, { term: e.target.value })}
              placeholder="Term"
              className={inputClassName + " text-xs"}
            />
            <span className="text-foreground/40 font-bold text-sm">→</span>
            <input
              value={pair.match}
              onChange={(e) => updatePair(index, { match: e.target.value })}
              placeholder="Match"
              className={inputClassName + " text-xs"}
            />
            <button type="button" onClick={() => removePair(index)} className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/60">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListeningEditor({
  payload,
  onChange,
}: {
  payload: ListeningPayload | null;
  onChange: (p: ListeningPayload) => void;
}) {
  const questions = payload?.questions ?? [];

  const addQuestion = () =>
    onChange({ audioUrl: payload?.audioUrl ?? "", questions: [...questions, { prompt: "", answer: "" }] });

  const updateQuestion = (index: number, patch: Partial<ListeningPayload["questions"][0]>) =>
    onChange({ audioUrl: payload?.audioUrl ?? "", questions: questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });

  const removeQuestion = (index: number) =>
    onChange({ audioUrl: payload?.audioUrl ?? "", questions: questions.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <FormField label="Audio URL">
        <input
          value={payload?.audioUrl ?? ""}
          onChange={(e) => onChange({ audioUrl: e.target.value, questions })}
          placeholder="https://…/audio.mp3"
          className={inputClassName + " text-xs"}
        />
      </FormField>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-foreground/60">Comprehension questions ({questions.length})</span>
        <button type="button" onClick={addQuestion} className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Plus className="size-3.5" strokeWidth={3} /> Add question
        </button>
      </div>
      {questions.length === 0 && (
        <p className="text-xs text-foreground/50 italic">No questions yet — add one or leave empty for open listening.</p>
      )}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {questions.map((q, index) => (
          <div key={index} className="rounded-2xl border-2 border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Q{index + 1}</span>
              <button type="button" onClick={() => removeQuestion(index)} className="cursor-pointer size-6 grid place-items-center rounded-md hover:bg-muted text-foreground/60">
                <Trash2 className="size-3" />
              </button>
            </div>
            <input
              value={q.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
              placeholder="Question…"
              className={inputClassName + " text-xs"}
            />
            <input
              value={q.answer ?? ""}
              onChange={(e) => updateQuestion(index, { answer: e.target.value })}
              placeholder="Expected answer (optional)"
              className={inputClassName + " text-xs"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function WritingCorrectionEditor({
  payload,
  onChange,
}: {
  payload: WritingCorrectionPayload | null;
  onChange: (p: WritingCorrectionPayload) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Writing prompt">
        <textarea
          value={payload?.prompt ?? ""}
          onChange={(e) => onChange({ prompt: e.target.value, rubric: payload?.rubric ?? null })}
          rows={3}
          placeholder="Write a paragraph describing your daily routine…"
          className={inputClassName + " text-xs"}
        />
      </FormField>
      <FormField label="Grading rubric (optional)">
        <textarea
          value={payload?.rubric ?? ""}
          onChange={(e) => onChange({ prompt: payload?.prompt ?? "", rubric: e.target.value || null })}
          rows={2}
          placeholder="e.g. Grammar (4pts), Vocabulary (3pts), Structure (3pts)…"
          className={inputClassName + " text-xs"}
        />
      </FormField>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
      <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2 text-foreground/70">{icon}</div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="mt-2 text-xl font-black leading-none">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-sm text-foreground/60">
      {text}
    </div>
  );
}

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 grid place-items-center">
      <div className="w-full max-w-xl rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-black">{title}</h3>
          <button type="button" onClick={onClose} className="size-9 rounded-xl border-2 border-border hover:bg-muted grid place-items-center">
            <ArrowLeft className="size-4 rotate-45" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DialogActions({ onCancel, onConfirm, confirmLabel }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onCancel} className="rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-bold hover:bg-muted">
        Cancel
      </button>
      <button type="button" onClick={onConfirm} className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90">
        {confirmLabel}
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

const inputClassName =
  "w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none";

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
