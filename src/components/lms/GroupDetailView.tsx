import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft, Calendar, Plus, Users, Video, Radio,
  Edit2, CheckCheck, Ban, RotateCcw, Loader2, X, Save,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { useCompanyStaff } from "@/lib/company-admin/staff-api";
import {
  useCourseGroup,
  useCourseGroupStudents,
  useCourseGroupSessions,
  useCreateCourseSession,
  useUpdateCourseSession,
  useEnrollStudent,
  useRemoveStudentFromGroup,
  type CourseSessionRecord,
  type CourseGroupStudentRecord,
  type GroupSessionAttendanceResponse,
} from "@/lib/lms-core-api";

function nextSessionFromBlocks(
  blocks: Array<{ day: string; startTime: string; endTime: string }> | null | undefined,
): { startsAt: string; endsAt: string } | null {
  if (!blocks || blocks.length === 0) return null;
  const DAY_INDEX: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const now = new Date();
  const todayDay = now.getDay();
  let best: { daysUntil: number; block: (typeof blocks)[0] } | null = null;
  for (const block of blocks) {
    const idx = DAY_INDEX[block.day];
    if (idx === undefined) continue;
    let daysUntil = (idx - todayDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    if (!best || daysUntil < best.daysUntil) best = { daysUntil, block };
  }
  if (!best) return null;
  const next = new Date(now);
  next.setDate(now.getDate() + best.daysUntil);
  const [sh, sm] = best.block.startTime.split(":").map(Number);
  const [eh, em] = best.block.endTime.split(":").map(Number);
  const startDt = new Date(next); startDt.setHours(sh, sm, 0, 0);
  const endDt = new Date(next); endDt.setHours(eh, em, 0, 0);
  const toLocal = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return { startsAt: toLocal(startDt), endsAt: toLocal(endDt) };
}

export function CourseCenterGroupBackend({
  groupId,
  backTo = "/groups",
  backLabel = "All groups",
}: {
  groupId: number;
  backTo?: string;
  backLabel?: string;
}) {
  const { t } = useTranslation();
  const groupQuery = useCourseGroup(Number.isFinite(groupId) ? groupId : null);
  const studentsQuery = useCourseGroupStudents(Number.isFinite(groupId) ? groupId : null);
  const sessionsQuery = useCourseGroupSessions(Number.isFinite(groupId) ? groupId : null);
  const companyStaffQuery = useCompanyStaff();
  const enrollMutation = useEnrollStudent();
  const removeStudentMutation = useRemoveStudentFromGroup();
  const createSessionMutation = useCreateCourseSession();
  const updateSessionMutation = useUpdateCourseSession();

  const [tab, setTab] = useState<"sessions" | "students" | "attendance">("sessions");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSessionRecord | null>(null);
  const [sTitle, setSTitle] = useState("");
  const [sStartsAt, setSStartsAt] = useState("");
  const [sEndsAt, setSEndsAt] = useState("");
  const [sStatus, setSStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [sNotes, setSNotes] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const group = groupQuery.data;
  const sessions = sessionsQuery.data ?? [];
  const students = studentsQuery.data?.items ?? [];

  const enrolledUserIds = new Set(students.map((s) => s.userId));
  const availableStudents = (companyStaffQuery.data ?? []).filter(
    (m) => m.role === "student" && m.status !== "suspended" && !enrolledUserIds.has(m.userId),
  );

  const handleEnroll = async () => {
    if (!selectedStudentId || !group) return;
    try {
      await enrollMutation.mutateAsync({ userId: Number(selectedStudentId), courseId: group.courseId, groupId });
      setSelectedStudentId("");
      setEnrollDialogOpen(false);
      toast.success(t("groupDetailPage.toast.studentEnrolledInGroup", { defaultValue: "Student enrolled in group" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.enrollFailed", { defaultValue: "Failed to enroll student" }));
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    try {
      await removeStudentMutation.mutateAsync({ groupId, userId });
      toast.success(t("groupDetailPage.toast.studentRemoved", { defaultValue: "Student removed from group" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.removeFailed", { defaultValue: "Failed to remove student" }));
    }
  };

  function openAddSession() {
    setEditingSession(null);
    setSTitle(t("groupDetailPage.sessionDialog.titlePlaceholder", { n: sessions.length + 1, defaultValue: `Session ${sessions.length + 1}` }));
    const preselect = nextSessionFromBlocks(group?.scheduleBlocks);
    setSStartsAt(preselect?.startsAt ?? "");
    setSEndsAt(preselect?.endsAt ?? "");
    setSStatus("scheduled");
    setSNotes("");
    setSessionDialogOpen(true);
  }

  function openEditSession(s: CourseSessionRecord) {
    setEditingSession(s);
    setSTitle(s.title);
    const toLocal = (v: string) => {
      const d = new Date(v);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    };
    setSStartsAt(toLocal(s.startsAt));
    setSEndsAt(toLocal(s.endsAt));
    setSStatus(s.status);
    setSNotes("");
    setSessionDialogOpen(true);
  }

  async function submitSession() {
    if (!sTitle.trim() || !sStartsAt || !sEndsAt) {
      toast.error(t("groupDetailPage.sessionDialog.required", { defaultValue: "Title, start time and end time are required" }));
      return;
    }
    try {
      if (editingSession) {
        await updateSessionMutation.mutateAsync({
          sessionId: editingSession.id,
          groupId,
          patch: {
            title: sTitle.trim(),
            startsAt: new Date(sStartsAt).toISOString(),
            endsAt: new Date(sEndsAt).toISOString(),
            status: sStatus,
            notes: sNotes.trim() || null,
          },
        });
        toast.success(t("groupDetailPage.toast.sessionUpdated", { defaultValue: "Session updated" }));
      } else {
        if (!group) return;
        await createSessionMutation.mutateAsync({
          groupId,
          sessionIndex: sessions.length + 1,
          title: sTitle.trim(),
          startsAt: new Date(sStartsAt).toISOString(),
          endsAt: new Date(sEndsAt).toISOString(),
          notes: sNotes.trim() || undefined,
        });
        toast.success(t("groupDetailPage.toast.sessionAdded", { defaultValue: "Session added" }));
      }
      setSessionDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.sessionSaveFailed", { defaultValue: "Failed to save session" }));
    }
  }

  async function quickStatus(s: CourseSessionRecord, next: "scheduled" | "completed" | "cancelled") {
    setUpdatingId(s.id);
    try {
      await updateSessionMutation.mutateAsync({ sessionId: s.id, groupId, patch: { status: next } });
      toast.success(
        next === "completed" ? t("groupDetailPage.quickActions.markComplete", { defaultValue: "Marked complete" }) :
        next === "cancelled" ? t("groupDetailPage.quickActions.cancelled", { defaultValue: "Session cancelled" }) :
        t("groupDetailPage.quickActions.reopened", { defaultValue: "Session reopened" }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.sessionUpdateFailed", { defaultValue: "Failed to update" }));
    } finally {
      setUpdatingId(null);
    }
  }

  const sessionBusy = createSessionMutation.isPending || updateSessionMutation.isPending;

  if (groupQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="h-12 w-64 rounded-2xl bg-card border-2 border-border animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <DashboardShell>
        <TopBar title="Group not found" showStreak={false} />
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
      </DashboardShell>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const upcomingSessions = sessions.filter((s) => s.status === "scheduled").length;
  const avgProgress = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.progressPercent ?? 0), 0) / students.length)
    : 0;

  return (
    <DashboardShell>
      <TopBar
        title={group.name}
        subtitle={group.course?.title ?? `Group ${group.code}`}
        showStreak={false}
      />

      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary mb-5">
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">{t("groupDetailPage.stats.students", { defaultValue: "Students" })}</p>
          <p className="mt-1 text-2xl font-black">{studentsQuery.data?.total ?? group.activeStudentCount ?? 0}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">{t("groupDetailPage.stats.avgProgress", { defaultValue: "Avg progress" })}</p>
          <p className="mt-1 text-2xl font-black text-primary">{avgProgress}%</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">{t("groupDetailPage.stats.completed", { defaultValue: "Completed" })}</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{completedSessions}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">{t("groupDetailPage.stats.upcoming", { defaultValue: "Upcoming" })}</p>
          <p className="mt-1 text-2xl font-black">{upcomingSessions}</p>
        </div>
      </div>

      {/* Group info card */}
      {(() => {
        const scheduleBlocks = group.scheduleBlocks ?? null;
        const meetingProvider = group.meetingProvider ?? null;
        const meetingUrl = group.meetingUrl ?? null;
        const instructor = group.instructor ?? null;
        const DAY_SHORT: Record<string, string> = {
          monday: "Mon", tuesday: "Tue", wednesday: "Wed",
          thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
        };
        const hasExtra =
          group.startDate || group.endDate || group.timezone || group.location ||
          group.seatLimit || (scheduleBlocks && scheduleBlocks.length > 0) ||
          meetingUrl || instructor;

        if (!hasExtra) return null;

        return (
          <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4 mb-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.info.title", { defaultValue: "Group info" })}</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
              <GroupInfoRow label={t("groupDetailPage.info.code", { defaultValue: "Code" })} value={group.code} />
              <GroupInfoRow label={t("groupDetailPage.info.status", { defaultValue: "Status" })} value={group.status} />
              {group.startDate ? <GroupInfoRow label={t("groupDetailPage.info.start", { defaultValue: "Start" })} value={new Date(group.startDate).toLocaleDateString()} /> : null}
              {group.endDate ? <GroupInfoRow label={t("groupDetailPage.info.end", { defaultValue: "End" })} value={new Date(group.endDate).toLocaleDateString()} /> : null}
              {group.seatLimit ? <GroupInfoRow label={t("groupDetailPage.info.seats", { defaultValue: "Seats" })} value={String(group.seatLimit)} /> : null}
              {group.timezone ? <GroupInfoRow label={t("groupDetailPage.info.timezone", { defaultValue: "Timezone" })} value={group.timezone} /> : null}
              {group.location ? <GroupInfoRow label={t("groupDetailPage.info.location", { defaultValue: "Location" })} value={group.location} /> : null}
            </div>

            {((scheduleBlocks && scheduleBlocks.length > 0) || meetingUrl) ? (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.info.schedule", { defaultValue: "Schedule" })}</p>
                <div className="flex flex-wrap gap-2">
                  {(scheduleBlocks ?? []).map((block, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary"
                    >
                      <Calendar className="size-3" />
                      {DAY_SHORT[block.day] ?? block.day} · {block.startTime}–{block.endTime}
                    </span>
                  ))}
                  {meetingUrl ? (
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground/70 hover:text-primary hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      {meetingProvider === "zoom" ? (
                        <Video className="size-3" />
                      ) : (
                        <Radio className="size-3" />
                      )}
                      {meetingProvider === "zoom" ? "Zoom" : meetingProvider === "google_meet" ? "Google Meet" : "Join meeting"}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {instructor ? (
              <div className="border-t border-border pt-3 flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black">{instructor.fullName ?? instructor.email ?? `Instructor #${instructor.id}`}</p>
                  {instructor.email ? <p className="text-xs text-foreground/50 truncate">{instructor.email}</p> : null}
                </div>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-foreground/40">{t("groupDetailPage.info.instructor", { defaultValue: "Instructor" })}</span>
              </div>
            ) : null}
          </div>
        );
      })()}

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {(["sessions", "students", "attendance"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all capitalize ${
              tab === tabKey
                ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                : "bg-card border-border hover:-translate-y-0.5"
            }`}
          >
            {t(`groupDetailPage.tabs.${tabKey}`, { defaultValue: tabKey })}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-foreground/60">{t("groupDetailPage.sessions.count", { count: sessions.length, defaultValue: `${sessions.length} session${sessions.length !== 1 ? "s" : ""}` })}</span>
            <button
              type="button"
              onClick={openAddSession}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground chunky-shadow hover:opacity-90 cursor-pointer transition-opacity"
            >
              <Plus className="size-3.5" strokeWidth={3} /> {t("groupDetailPage.sessions.scheduleSession", { defaultValue: "Schedule session" })}
            </button>
          </div>

          {sessionsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center space-y-3">
              <p className="text-sm font-medium text-foreground/60">{t("groupDetailPage.sessions.empty", { defaultValue: "No sessions scheduled yet." })}</p>
              <button
                type="button"
                onClick={openAddSession}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Plus className="size-4" strokeWidth={3} /> {t("groupDetailPage.sessions.scheduleFirst", { defaultValue: "Schedule first session" })}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const isUpdating = updatingId === session.id;
                const statusStyle =
                  session.status === "completed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : session.status === "cancelled"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-muted text-foreground/60";

                return (
                  <Link
                    key={session.id}
                    to="/groups/$groupId/sessions/$sessionId"
                    params={{ groupId: String(groupId), sessionId: String(session.id) }}
                    className="block bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 grid place-items-center rounded-xl bg-muted shrink-0">
                        <Calendar className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{session.title}</p>
                        <p className="text-xs font-bold text-foreground/60">
                          {session.startsAt ? format(new Date(session.startsAt), "MMM d, yyyy · HH:mm") : "TBD"}
                          {session.location ? ` · ${session.location}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${statusStyle}`}>
                          {session.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditSession(session); }}
                          className="size-8 grid place-items-center rounded-xl border-2 border-border text-foreground/60 hover:bg-muted cursor-pointer transition-colors"
                          aria-label="Edit session"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        {session.status === "scheduled" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickStatus(session, "completed"); }}
                              disabled={isUpdating}
                              className="size-8 grid place-items-center rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-100 cursor-pointer transition-colors disabled:opacity-50"
                              aria-label="Mark complete"
                            >
                              {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickStatus(session, "cancelled"); }}
                              disabled={isUpdating}
                              className="size-8 grid place-items-center rounded-xl border-2 border-border text-foreground/40 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-200 cursor-pointer transition-colors disabled:opacity-50"
                              aria-label="Cancel session"
                            >
                              {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                            </button>
                          </>
                        )}
                        {(session.status === "completed" || session.status === "cancelled") && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickStatus(session, "scheduled"); }}
                            disabled={isUpdating}
                            className="size-8 grid place-items-center rounded-xl border-2 border-border text-foreground/50 hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                            aria-label="Reopen session"
                          >
                            {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "students" && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-foreground/60">{t("groupDetailPage.students.enrolled", { count: studentsQuery.data?.total ?? students.length, defaultValue: `${studentsQuery.data?.total ?? students.length} enrolled` })}</span>
            <button
              type="button"
              onClick={() => setEnrollDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground chunky-shadow hover:opacity-90"
            >
              <Plus className="size-3.5" strokeWidth={3} /> {t("groupDetailPage.students.addStudent", { defaultValue: "Add student" })}
            </button>
          </div>
          {studentsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
              {t("groupDetailPage.students.noStudents", { defaultValue: "No students enrolled yet." })}
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.userId} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow flex items-center gap-4">
                  <div className="size-9 grid place-items-center rounded-xl bg-muted shrink-0">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{student.fullName ?? student.email ?? `Student ${student.userId}`}</p>
                    <p className="text-xs font-bold text-foreground/60 truncate">{student.email ?? ""}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 min-w-[80px]">
                    <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${student.progressPercent}%` }} />
                    </div>
                    <span className="text-xs font-black font-mono">{student.progressPercent}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.userId)}
                    disabled={removeStudentMutation.isPending}
                    className="size-8 grid place-items-center rounded-lg border-2 border-border text-foreground/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
                    aria-label="Remove student"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "attendance" && (
        <GroupAttendanceMatrix sessions={sessions} students={students} />
      )}

      <Dialog open={sessionDialogOpen} onOpenChange={(open) => { if (!sessionBusy) setSessionDialogOpen(open); }}>
        <DialogContent className="max-w-lg rounded-3xl border-2 border-border bg-card p-6 chunky-shadow gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">
              {editingSession
                ? t("groupDetailPage.sessionDialog.titleEdit", { defaultValue: "Edit session" })
                : t("groupDetailPage.sessionDialog.titleSchedule", { defaultValue: "Schedule session" })}
            </h2>
            <button
              type="button"
              onClick={() => { if (!sessionBusy) setSessionDialogOpen(false); }}
              className="size-9 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-4">
            <FormField label={t("groupDetailPage.sessionDialog.fieldTitle", { defaultValue: "Title" })}>
              <input
                value={sTitle}
                onChange={(e) => setSTitle(e.target.value)}
                placeholder={t("groupDetailPage.sessionDialog.titlePlaceholder", { n: sessions.length + 1, defaultValue: "e.g. Session 4" })}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t("groupDetailPage.sessionDialog.fieldStartsAt", { defaultValue: "Starts at" })}>
                <input
                  type="datetime-local"
                  value={sStartsAt}
                  onChange={(e) => setSStartsAt(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
              <FormField label={t("groupDetailPage.sessionDialog.fieldEndsAt", { defaultValue: "Ends at" })}>
                <input
                  type="datetime-local"
                  value={sEndsAt}
                  onChange={(e) => setSEndsAt(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
            </div>
            {editingSession && (
              <FormField label={t("groupDetailPage.sessionDialog.fieldStatus", { defaultValue: "Status" })}>
                <select
                  value={sStatus}
                  onChange={(e) => setSStatus(e.target.value as typeof sStatus)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="scheduled">{t("groupDetailPage.sessionDialog.statusScheduled", { defaultValue: "Scheduled" })}</option>
                  <option value="completed">{t("groupDetailPage.sessionDialog.statusCompleted", { defaultValue: "Completed" })}</option>
                  <option value="cancelled">{t("groupDetailPage.sessionDialog.statusCancelled", { defaultValue: "Cancelled" })}</option>
                </select>
              </FormField>
            )}
            <FormField label={t("groupDetailPage.sessionDialog.fieldNotes", { defaultValue: "Notes (optional)" })}>
              <textarea
                value={sNotes}
                onChange={(e) => setSNotes(e.target.value)}
                rows={2}
                placeholder={t("groupDetailPage.sessionDialog.notesPlaceholder", { defaultValue: "Any notes…" })}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none resize-none"
              />
            </FormField>
            <DialogActions
              onCancel={() => setSessionDialogOpen(false)}
              onConfirm={submitSession}
              confirmLabel={
                sessionBusy
                  ? editingSession
                    ? t("groupDetailPage.sessionDialog.saving", { defaultValue: "Saving…" })
                    : t("groupDetailPage.sessionDialog.scheduling", { defaultValue: "Adding…" })
                  : editingSession
                    ? t("groupDetailPage.sessionDialog.confirmEdit", { defaultValue: "Save changes" })
                    : t("groupDetailPage.sessionDialog.confirmSchedule", { defaultValue: "Schedule session" })
              }
              loading={sessionBusy}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollDialogOpen} onOpenChange={(open) => { setEnrollDialogOpen(open); if (!open) setSelectedStudentId(""); }}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-border bg-card p-6 chunky-shadow gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">{t("groupDetailPage.enrollDialog.titleInGroup", { defaultValue: "Enroll student in group" })}</h2>
            <button
              type="button"
              onClick={() => { setEnrollDialogOpen(false); setSelectedStudentId(""); }}
              className="size-9 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-4">
            <FormField label={t("groupDetailPage.enrollDialog.fieldStudent", { defaultValue: "Student" })}>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="">{t("groupDetailPage.enrollDialog.selectStudent", { defaultValue: "Select a student" })}</option>
                {availableStudents.map((m) => (
                  <option key={m.userId} value={String(m.userId)}>
                    {m.fullName ?? m.email ?? `Student #${m.userId}`}
                  </option>
                ))}
              </select>
            </FormField>
            {availableStudents.length === 0 && (
              <p className="text-xs text-foreground/60">
                {t("groupDetailPage.students.noStudentsAvailable", { defaultValue: "All student members are already enrolled, or no students have been invited yet." })}
              </p>
            )}
            <DialogActions
              onCancel={() => { setEnrollDialogOpen(false); setSelectedStudentId(""); }}
              onConfirm={handleEnroll}
              confirmLabel={enrollMutation.isPending
                ? t("groupDetailPage.enrollDialog.confirming", { defaultValue: "Enrolling…" })
                : t("groupDetailPage.enrollDialog.confirm", { defaultValue: "Enroll student" })}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

// ─── Attendance matrix ────────────────────────────────────────────────────────

const ATTENDANCE_OPTIONS = [
  { value: "present" as const, label: "P", title: "Present", style: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
  { value: "late" as const, label: "L", title: "Late", style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" },
  { value: "absent" as const, label: "A", title: "Absent", style: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
  { value: "excused" as const, label: "E", title: "Excused", style: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400" },
];

type AttStatus = "present" | "absent" | "late" | "excused";

function GroupAttendanceMatrix({
  sessions,
  students,
}: {
  sessions: CourseSessionRecord[];
  students: CourseGroupStudentRecord[];
}) {
  const { t } = useTranslation();
  const [attendanceData, setAttendanceData] = useState<Record<number, Record<number, AttStatus>>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const [savingMap, setSavingMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [sessions],
  );

  useEffect(() => {
    if (sessions.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(
      sessions.map((s) =>
        apiRequest<GroupSessionAttendanceResponse>(`/attendance/sessions/${s.id}`)
          .then((res) => ({ sessionId: s.id, items: res.items }))
          .catch(() => ({ sessionId: s.id, items: [] })),
      ),
    ).then((results) => {
      const map: Record<number, Record<number, AttStatus>> = {};
      for (const { sessionId, items } of results) {
        map[sessionId] = {};
        for (const item of items) map[sessionId][item.userId] = item.status;
      }
      setAttendanceData(map);
      setLoading(false);
    });
  }, [sessions]);

  function setStatus(sessionId: number, userId: number, status: AttStatus) {
    setAttendanceData((prev) => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), [userId]: status },
    }));
    setDirtyMap((prev) => ({ ...prev, [sessionId]: true }));
  }

  function markAllPresent(sessionId: number) {
    setAttendanceData((prev) => {
      const next: Record<number, AttStatus> = { ...(prev[sessionId] ?? {}) };
      for (const s of students) next[s.userId] = "present";
      return { ...prev, [sessionId]: next };
    });
    setDirtyMap((prev) => ({ ...prev, [sessionId]: true }));
  }

  async function saveSession(sessionId: number) {
    setSavingMap((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const sessionData = attendanceData[sessionId] ?? {};
      const rows = students.map((s) => ({ studentId: s.userId, status: sessionData[s.userId] ?? "absent" }));
      await apiRequest(`/attendance/sessions/${sessionId}/bulk`, { method: "POST", body: { rows } });
      setDirtyMap((prev) => ({ ...prev, [sessionId]: false }));
      toast.success(t("groupDetailPage.toast.attendanceSaved", { defaultValue: "Attendance saved" }));
    } catch {
      toast.error(t("groupDetailPage.toast.attendanceFailed", { defaultValue: "Failed to save attendance" }));
    } finally {
      setSavingMap((prev) => ({ ...prev, [sessionId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-foreground/30" />
      </div>
    );
  }

  if (sortedSessions.length === 0 || students.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center text-sm text-foreground/60">
        {sortedSessions.length === 0
          ? t("groupDetailPage.attendance.noSessions", { defaultValue: "No sessions yet." })
          : t("groupDetailPage.attendance.noStudents", { defaultValue: "No students enrolled." })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border overflow-x-auto">
      <table
        className="text-sm border-separate border-spacing-0"
        style={{ minWidth: `${220 + sortedSessions.length * 172}px` }}
      >
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 border-b-2 border-r border-border min-w-[200px]">
              Student
            </th>
            {sortedSessions.map((session) => {
              const isDirty = dirtyMap[session.id];
              const isSaving = savingMap[session.id];
              const date = new Date(session.startsAt);
              const statusColor =
                session.status === "completed" ? "text-green-600" :
                session.status === "cancelled" ? "text-red-500" : "text-foreground/40";
              return (
                <th
                  key={session.id}
                  className="px-3 py-2 text-center border-b-2 border-r border-border/50 last:border-r-0 min-w-[168px]"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-foreground/70 truncate max-w-[150px] mx-auto">
                      {session.title}
                    </p>
                    <p className={`text-[10px] font-bold ${statusColor}`}>
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => markAllPresent(session.id)}
                        title="Mark all present"
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 hover:bg-green-100 cursor-pointer transition-colors"
                      >
                        {t("groupDetailPage.attendance.markAllPresent", { defaultValue: "All P" })}
                      </button>
                      {isDirty && (
                        <button
                          type="button"
                          onClick={() => saveSession(session.id)}
                          disabled={isSaving}
                          title="Save attendance"
                          className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="size-2.5 animate-spin" /> : <Save className="size-2.5" />}
                          {t("groupDetailPage.attendance.save", { defaultValue: "Save" })}
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.userId} className="hover:bg-muted/20 transition-colors border-b border-border/40 last:border-0">
              <td className="sticky left-0 z-10 bg-card px-4 py-2.5 border-r border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/40 tabular-nums w-4 shrink-0">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate max-w-[150px]">
                      {student.fullName ?? student.email ?? `Student #${student.userId}`}
                    </p>
                    {student.email && student.fullName && (
                      <p className="text-[10px] text-foreground/50 truncate">{student.email}</p>
                    )}
                  </div>
                </div>
              </td>
              {sortedSessions.map((session) => {
                const status = (attendanceData[session.id] ?? {})[student.userId];
                return (
                  <td
                    key={session.id}
                    className="px-2 py-2 text-center border-r border-b border-border/30 last:border-r-0"
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      {ATTENDANCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(session.id, student.userId, opt.value)}
                          title={opt.title}
                          className={`size-7 rounded-lg border text-[10px] font-black cursor-pointer transition-all ${
                            status === opt.value
                              ? opt.style
                              : "border-border text-foreground/25 hover:border-foreground/30 hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Local UI helpers ─────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-widest text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function DialogActions({
  onCancel,
  onConfirm,
  confirmLabel,
  loading,
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  confirmLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function GroupInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-bold text-foreground">{label}:</span>{" "}
      <span className="text-foreground/70">{value}</span>
    </div>
  );
}
