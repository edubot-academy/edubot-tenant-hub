import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ClipboardList, Plus, Radio, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useRole } from "@/lib/roles";
import {
  type AcademicSessionActivityRecord,
  type AcademicSessionHomeworkRecord,
  useAcademicClass,
  useAcademicClassStudents,
  useAcademicClassTimetable,
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
  useUpdateAcademicSessionActivity,
  useUpdateAcademicSessionHomework,
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

  const session = useMemo(
    () => (timetableQuery.data?.items ?? []).find((item) => item.id === numericSessionId) ?? null,
    [timetableQuery.data?.items, numericSessionId],
  );
  const roster = useMemo(
    () => (studentsQuery.data?.items ?? []).filter((item) => item.status === "active"),
    [studentsQuery.data?.items],
  );

  const [attendanceDraft, setAttendanceDraft] = useState<Record<number, "present" | "absent" | "late" | "excused">>({});
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
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
  const [activityType, setActivityType] = useState<"discussion" | "exercise" | "quiz" | "group_work">("discussion");
  const [activityStatus, setActivityStatus] = useState<"planned" | "active" | "done">("planned");
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | "needs_revision">("approved");
  const [reviewScore, setReviewScore] = useState("");
  const [reviewComment, setReviewComment] = useState("");
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
      const payload = {
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        type: activityType,
        status: activityStatus,
      };
      if (selectedActivity) {
        await updateActivityMutation.mutateAsync({ activityId: selectedActivity.id, patch: payload });
      } else {
        await createActivityMutation.mutateAsync(payload);
      }
      setActivityTitle("");
      setActivityDescription("");
      setActivityType("discussion");
      setActivityStatus("planned");
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
    setActivityDialogOpen(true);
  };

  const openHomeworkReview = (item: AcademicSessionHomeworkRecord) => {
    setHomeworkReviewTarget(item);
    setReviewStatus("approved");
    setReviewScore("");
    setReviewComment("");
  };

  const openActivityReview = (item: AcademicSessionActivityRecord) => {
    setActivityReviewTarget(item);
    setReviewStatus("approved");
    setReviewScore("");
    setReviewComment("");
  };

  const submitHomeworkReview = async (submissionId: number) => {
    try {
      await reviewHomeworkSubmissionMutation.mutateAsync({
        submissionId,
        status: reviewStatus,
        score: reviewScore ? Number(reviewScore) : null,
        reviewComment: reviewComment.trim() || null,
      });
      toast.success("Homework review saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save homework review");
    }
  };

  const submitActivityReview = async (submissionId: number) => {
    try {
      await reviewActivitySubmissionMutation.mutateAsync({
        submissionId,
        status: reviewStatus,
        score: reviewScore ? Number(reviewScore) : null,
        reviewComment: reviewComment.trim() || null,
      });
      toast.success("Activity review saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save activity review");
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roster.map((item) => (
                <div key={item.id} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-sm">{item.student?.fullName ?? item.student?.email ?? `Student #${item.studentId}`}</p>
                      <p className="text-xs text-foreground/60">{item.student?.email ?? "No email"}</p>
                    </div>
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
                  </div>
                </div>
              ))}
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
                <button
                  type="button"
                  onClick={() => openActivityEditor()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                >
                  <Plus className="size-4" strokeWidth={3} /> New activity
                </button>
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
                          {item.type}
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
                <select value={activityType} onChange={(event) => setActivityType(event.target.value as "discussion" | "exercise" | "quiz" | "group_work")} className={inputClassName}>
                  <option value="discussion">Discussion</option>
                  <option value="exercise">Exercise</option>
                  <option value="quiz">Quiz</option>
                  <option value="group_work">Group work</option>
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
                      <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as "approved" | "rejected" | "needs_revision")} className={inputClassName}>
                        <option value="approved">Approved</option>
                        <option value="needs_revision">Needs revision</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormField>
                    <FormField label="Score">
                      <input value={reviewScore} onChange={(event) => setReviewScore(event.target.value)} type="number" min="0" className={inputClassName} />
                    </FormField>
                    <FormField label="Review comment">
                      <input value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} className={inputClassName} />
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
                      <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as "approved" | "rejected" | "needs_revision")} className={inputClassName}>
                        <option value="approved">Approved</option>
                        <option value="needs_revision">Needs revision</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormField>
                    <FormField label="Score">
                      <input value={reviewScore} onChange={(event) => setReviewScore(event.target.value)} type="number" min="0" className={inputClassName} />
                    </FormField>
                    <FormField label="Review comment">
                      <input value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} className={inputClassName} />
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
    </DashboardShell>
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
