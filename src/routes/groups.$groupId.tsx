import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ArrowLeft, BookMarked, Calendar, CheckCircle2, Clock, User, Video, Wifi,
  Plus, X, Edit2, RotateCcw, CheckCheck, Ban, Users, Loader2, Link2,
} from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useCompanyStaff } from "@/lib/company-admin/staff-api";
import {
  useCourseGroup,
  useCourseGroupStudents,
  useCourseGroupSessions,
  useCourseGroupProgress,
  useCreateCourseSession,
  useUpdateCourseSession,
  useEnrollStudent,
  useRemoveStudentFromGroup,
  type CourseSessionRecord,
} from "@/lib/lms-core-api";
import { CourseCenterGroupBackend } from "@/components/lms/GroupDetailView";

export const Route = createFileRoute("/groups/$groupId")({
  head: () => ({ meta: [{ title: "QuestLMS — Group" }] }),
  component: GroupDetailPage,
});

function GroupDetailPage() {
  const { groupId } = Route.useParams();
  const numericGroupId = Number(groupId);
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const childMatches = useChildMatches();

  const groupQuery = useCourseGroup(backendEnabled && Number.isFinite(numericGroupId) ? numericGroupId : null);

  if (childMatches.length > 0) return <Outlet />;

  if (groupQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="h-12 w-64 rounded-2xl bg-card border-2 border-border animate-pulse mb-4" />
        <div className="h-80 rounded-3xl border-2 border-border bg-card animate-pulse" />
      </DashboardShell>
    );
  }

  if (groupQuery.data?.deliveryMode === "individual") {
    return <IndividualGroupDetailPage numericGroupId={numericGroupId} backendEnabled={backendEnabled} />;
  }

  return <CourseCenterGroupBackend groupId={numericGroupId} backTo="/groups" backLabel="All groups" />;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const PROVIDER_ICONS: Record<string, typeof Video> = {
  zoom: Video,
  google_meet: Wifi,
  custom: Link2,
};

const PROVIDER_LABELS: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  custom: "Meeting link",
};

const ACTIVITY_LABELS: Record<string, string> = {
  discussion: "Discussion", exercise: "Exercise", quiz: "Quiz",
  group_work: "Group work", vocabulary: "Vocabulary", fill_blank: "Fill blank",
  word_match: "Word match", listening: "Listening", writing_correction: "Writing",
};

function toLocalDT(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// ─── Individual group detail ──────────────────────────────────────────────────

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

function IndividualGroupDetailPage({
  numericGroupId,
  backendEnabled,
}: {
  numericGroupId: number;
  backendEnabled: boolean;
}) {
  const { t } = useTranslation();
  const enabled = backendEnabled && Number.isFinite(numericGroupId) ? numericGroupId : null;

  const groupQuery = useCourseGroup(enabled);
  const studentsQuery = useCourseGroupStudents(enabled);
  const sessionsQuery = useCourseGroupSessions(enabled);
  const progressQuery = useCourseGroupProgress(enabled);
  const staffQuery = useCompanyStaff();

  const createMutation = useCreateCourseSession();
  const updateMutation = useUpdateCourseSession();
  const enrollMutation = useEnrollStudent();
  const removeMutation = useRemoveStudentFromGroup();

  // ── Session dialog ──────────────────────────────────────────────────────────
  const [sessionOpen, setSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSessionRecord | null>(null);
  const [sTitle, setSTitle] = useState("");
  const [sStartsAt, setSStartsAt] = useState("");
  const [sEndsAt, setSEndsAt] = useState("");
  const [sStatus, setSStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [sNotes, setSNotes] = useState("");

  // ── Enroll dialog ───────────────────────────────────────────────────────────
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollId, setEnrollId] = useState("");

  // ── Inline status tracking ──────────────────────────────────────────────────
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const group = groupQuery.data;
  const student = useMemo(() => studentsQuery.data?.items?.[0] ?? null, [studentsQuery.data]);
  const sessions = useMemo(
    () =>
      (sessionsQuery.data ?? [])
        .slice()
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [sessionsQuery.data],
  );
  const progress = progressQuery.data;

  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const scheduledCount = sessions.filter((s) => s.status === "scheduled").length;
  const makeupCount = sessions.filter((s) => s.isMakeup).length;

  type ProgressRow = NonNullable<typeof progress>["sessions"][number];
  const progressBySession = useMemo(() => {
    const map = new Map<number, ProgressRow>();
    if (progress) for (const row of progress.sessions) map.set(row.sessionId, row);
    return map;
  }, [progress]);

  const enrolledIds = new Set(studentsQuery.data?.items?.map((s) => s.userId) ?? []);
  const availableStudents = (staffQuery.data ?? []).filter(
    (m) => m.role === "student" && m.status === "active" && !enrolledIds.has(m.userId),
  );

  // ── Schedule blocks + meeting (new fields from backend) ────────────────────
  const scheduleBlocks = group?.scheduleBlocks ?? null;
  const meetingProvider = group?.meetingProvider ?? null;
  const meetingUrl = group?.meetingUrl ?? null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingSession(null);
    setSTitle(t("groupDetailPage.sessionDialog.titlePlaceholder", { n: sessions.length + 1, defaultValue: `Session ${sessions.length + 1}` }));
    const preselect = nextSessionFromBlocks(scheduleBlocks);
    setSStartsAt(preselect?.startsAt ?? "");
    setSEndsAt(preselect?.endsAt ?? "");
    setSStatus("scheduled");
    setSNotes("");
    setSessionOpen(true);
  }

  function openEdit(s: CourseSessionRecord) {
    setEditingSession(s);
    setSTitle(s.title);
    setSStartsAt(toLocalDT(s.startsAt));
    setSEndsAt(toLocalDT(s.endsAt));
    setSStatus(s.status);
    setSNotes("");
    setSessionOpen(true);
  }

  async function submitSession() {
    if (!sTitle.trim() || !sStartsAt || !sEndsAt) {
      toast.error(t("groupDetailPage.sessionDialog.required", { defaultValue: "Title, start time and end time are required" }));
      return;
    }
    try {
      if (editingSession) {
        await updateMutation.mutateAsync({
          sessionId: editingSession.id,
          groupId: numericGroupId,
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
        await createMutation.mutateAsync({
          groupId: numericGroupId,
          sessionIndex: sessions.length + 1,
          title: sTitle.trim(),
          startsAt: new Date(sStartsAt).toISOString(),
          endsAt: new Date(sEndsAt).toISOString(),
          notes: sNotes.trim() || undefined,
        });
        toast.success(t("groupDetailPage.toast.sessionAdded", { defaultValue: "Session added" }));
      }
      setSessionOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.sessionSaveFailed", { defaultValue: "Failed to save session" }));
    }
  }

  async function quickStatus(s: CourseSessionRecord, next: "scheduled" | "completed" | "cancelled") {
    setUpdatingId(s.id);
    try {
      await updateMutation.mutateAsync({ sessionId: s.id, groupId: numericGroupId, patch: { status: next } });
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

  async function handleEnroll() {
    if (!enrollId || !group) return;
    try {
      await enrollMutation.mutateAsync({
        userId: Number(enrollId),
        courseId: group.courseId,
        groupId: numericGroupId,
      });
      toast.success(t("groupDetailPage.toast.studentEnrolled", { defaultValue: "Student enrolled" }));
      setEnrollOpen(false);
      setEnrollId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.enrollFailed", { defaultValue: "Failed to enroll student" }));
    }
  }

  async function handleRemove() {
    if (!student) return;
    try {
      await removeMutation.mutateAsync({ groupId: numericGroupId, userId: student.userId });
      toast.success(t("groupDetailPage.toast.studentRemoved", { defaultValue: "Student removed from group" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groupDetailPage.toast.removeFailed", { defaultValue: "Failed to remove student" }));
    }
  }

  const sessionBusy = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardShell>
      <TopBar
        title={group?.name ?? t("groupDetailPage.title.groupFallback", { defaultValue: "Individual group" })}
        subtitle={group?.course?.title ?? t("groupDetailPage.title.subtitle", { defaultValue: "1-on-1 session management" })}
        showStreak={false}
      />

      {/* Nav + primary actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> {t("groupDetailPage.nav.allGroups", { defaultValue: "All groups" })}
        </Link>

        <div className="flex items-center gap-2">
          {!student && !studentsQuery.isLoading && (
            <button
              type="button"
              onClick={() => setEnrollOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground/70 hover:bg-muted cursor-pointer transition-colors chunky-shadow"
            >
              <Users className="size-4" /> {t("groupDetailPage.students.enrollStudent", { defaultValue: "Enroll student" })}
            </button>
          )}
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity chunky-shadow"
          >
            <Plus className="size-4" strokeWidth={3} /> {t("groupDetailPage.sessions.addSession", { defaultValue: "Add session" })}
          </button>
        </div>
      </div>

      {!group ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-10 text-center">
          <p className="font-bold text-destructive">{t("groupDetailPage.notFound", { defaultValue: "Group not found" })}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<CheckCircle2 className="size-4" />} label={t("groupDetailPage.stats.completed", { defaultValue: "Completed" })} value={String(completedCount)} color="text-green-600" />
            <StatCard icon={<Clock className="size-4" />} label={t("groupDetailPage.stats.scheduled", { defaultValue: "Scheduled" })} value={String(scheduledCount)} />
            <StatCard icon={<BookMarked className="size-4" />} label={t("groupDetailPage.stats.makeup", { defaultValue: "Makeup" })} value={String(makeupCount)} color="text-amber-600" />
            <StatCard icon={<Calendar className="size-4" />} label={t("groupDetailPage.stats.total", { defaultValue: "Total" })} value={String(sessions.length)} />
          </div>

          {/* Group info card */}
          <section className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.info.title", { defaultValue: "Group info" })}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
              <InfoRow label={t("groupDetailPage.info.code", { defaultValue: "Code" })} value={group.code} />
              <InfoRow label={t("groupDetailPage.info.status", { defaultValue: "Status" })} value={group.status} />
              {group.startDate ? <InfoRow label={t("groupDetailPage.info.start", { defaultValue: "Start" })} value={new Date(group.startDate).toLocaleDateString()} /> : null}
              {group.endDate ? <InfoRow label={t("groupDetailPage.info.end", { defaultValue: "End" })} value={new Date(group.endDate).toLocaleDateString()} /> : null}
              {group.timezone ? <InfoRow label={t("groupDetailPage.info.timezone", { defaultValue: "Timezone" })} value={group.timezone} /> : null}
              {group.location ? <InfoRow label={t("groupDetailPage.info.location", { defaultValue: "Location" })} value={group.location} /> : null}
            </div>

            {/* Recurring schedule + meeting link */}
            {(scheduleBlocks && scheduleBlocks.length > 0) || meetingUrl ? (
              <div className="border-t border-border pt-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.info.schedule", { defaultValue: "Schedule" })}</p>
                <div className="flex flex-wrap gap-2">
                  {(scheduleBlocks ?? []).map((block, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary"
                    >
                      <Calendar className="size-3" />
                      {DAY_LABELS[block.day] ?? block.day} · {block.startTime}–{block.endTime}
                    </span>
                  ))}
                  {meetingUrl ? (
                    <MeetingPill provider={meetingProvider} url={meetingUrl} />
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Student */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.student.sectionTitle", { defaultValue: "Student" })}</p>

              {student ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="size-10 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">
                    <User className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm leading-snug">
                      {student.fullName ?? student.email ?? `Student #${student.userId}`}
                    </p>
                    <p className="text-xs text-foreground/60">{student.email ?? "No email"}</p>
                    {student.enrolledAt ? (
                      <p className="text-xs text-foreground/45 mt-0.5">
                        {t("groupDetailPage.student.enrolledAt", { date: new Date(student.enrolledAt).toLocaleDateString(), defaultValue: `Enrolled ${new Date(student.enrolledAt).toLocaleDateString()}` })}
                      </p>
                    ) : null}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${student.progressPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-black tabular-nums">{student.progressPercent ?? 0}%</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <Link
                      to="/instructor/students/$userId"
                      params={{ userId: String(student.userId) }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {t("groupDetailPage.students.viewProfile", { defaultValue: "View profile" })}
                    </Link>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removeMutation.isPending}
                      className="size-8 grid place-items-center rounded-xl border-2 border-border text-foreground/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer transition-colors disabled:opacity-50"
                      aria-label="Remove student from group"
                    >
                      {removeMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ) : studentsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-foreground/50">
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-border p-4">
                  <p className="text-sm text-foreground/50 italic">{t("groupDetailPage.student.noStudent", { defaultValue: "No student enrolled yet." })}</p>
                  <button
                    type="button"
                    onClick={() => setEnrollOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15 cursor-pointer transition-colors"
                  >
                    <Plus className="size-3.5" strokeWidth={3} /> {t("groupDetailPage.student.enroll", { defaultValue: "Enroll" })}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Sessions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h3 className="text-lg font-black">{t("groupDetailPage.tabs.sessions", { defaultValue: "sessions" })}</h3>
                {sessions.length > 0 && (
                  <span className="text-xs font-bold text-foreground/40">{t("groupDetailPage.sessions.total", { count: sessions.length, defaultValue: `${sessions.length} total` })}</span>
                )}
              </div>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3 py-2 text-xs font-bold text-foreground/70 hover:bg-muted cursor-pointer transition-colors"
              >
                <Plus className="size-3.5" strokeWidth={3} /> {t("groupDetailPage.sessions.add", { defaultValue: "Add" })}
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-3">
                {sessionsQuery.isLoading ? (
                  <Loader2 className="size-6 animate-spin text-foreground/30 mx-auto" />
                ) : (
                  <>
                    <p className="text-sm font-bold text-foreground/50">{t("groupDetailPage.sessions.empty", { defaultValue: "No sessions scheduled yet." })}</p>
                    <button
                      type="button"
                      onClick={openAdd}
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <Plus className="size-4" strokeWidth={3} /> {t("groupDetailPage.sessions.addFirst", { defaultValue: "Add first session" })}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isUpdating = updatingId === session.id;
                  const sessionProgress = progressBySession.get(session.id);
                  const statusStyle =
                    session.status === "completed"
                      ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                      : session.status === "cancelled"
                      ? "text-red-500 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                      : "text-foreground/60 bg-muted border-border";

                  return (
                    <Link
                      key={session.id}
                      to="/groups/$groupId/sessions/$sessionId"
                      params={{ groupId: String(numericGroupId), sessionId: String(session.id) }}
                      className="block rounded-2xl border-2 border-border bg-card p-4 chunky-shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Left: info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-sm">{session.title}</p>
                            {session.isMakeup ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                <BookMarked className="size-2.5" /> Makeup
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-foreground/60">
                            {new Date(session.startsAt).toLocaleString()} —{" "}
                            {new Date(session.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {session.liveJoinUrl ? (
                            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                              {session.liveProvider === "zoom" ? (
                                <Video className="size-3" />
                              ) : (
                                <Wifi className="size-3" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(session.liveJoinUrl!, "_blank", "noopener,noreferrer"); }}
                                className="hover:underline truncate cursor-pointer"
                              >
                                {session.liveProvider === "zoom"
                                  ? "Zoom"
                                  : session.liveProvider === "google_meet"
                                  ? "Google Meet"
                                  : "Join meeting"}
                              </button>
                            </div>
                          ) : null}
                          {session.activities.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {session.activities.slice(0, 3).map((a) => (
                                <span
                                  key={a.id}
                                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground/60"
                                >
                                  {ACTIVITY_LABELS[a.type] ?? a.type}
                                </span>
                              ))}
                              {session.activities.length > 3 && (
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground/60">
                                  +{session.activities.length - 3}
                                </span>
                              )}
                            </div>
                          ) : null}
                          {sessionProgress &&
                          (sessionProgress.homeworkAssigned > 0 || sessionProgress.activitiesTotal > 0) ? (
                            <div className="flex items-center gap-3 pt-1.5 border-t border-border/50 text-xs text-foreground/60">
                              {sessionProgress.homeworkAssigned > 0 ? (
                                <span className="flex items-center gap-1">
                                  <BookMarked className="size-3" />
                                  HW: {sessionProgress.homeworkSubmitted}/{sessionProgress.homeworkAssigned}
                                  {sessionProgress.averageScore !== null
                                    ? ` · ${sessionProgress.averageScore}%`
                                    : ""}
                                </span>
                              ) : null}
                              {sessionProgress.activitiesTotal > 0 ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  {sessionProgress.activitiesTotal} activit
                                  {sessionProgress.activitiesTotal === 1 ? "y" : "ies"}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        {/* Right: status + actions */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Status badge + recording */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${statusStyle}`}
                            >
                              {session.status}
                            </span>
                            {session.recordingUrl ? (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(session.recordingUrl!, "_blank", "noopener,noreferrer"); }}
                                className="size-8 grid place-items-center rounded-xl border-2 border-border hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
                                title="Recording"
                              >
                                <Video className="size-3.5" />
                              </button>
                            ) : null}
                          </div>

                          {/* Quick-action buttons */}
                          <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); openEdit(session); }}
                              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-xs font-bold text-foreground/70 hover:bg-muted cursor-pointer transition-colors"
                              aria-label="Edit session"
                            >
                              <Edit2 className="size-3" /> Edit
                            </button>

                            {session.status === "scheduled" && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); quickStatus(session, "completed"); }}
                                  disabled={isUpdating}
                                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer transition-colors disabled:opacity-50"
                                  aria-label="Mark session complete"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <CheckCheck className="size-3" />
                                  )}
                                  Done
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); quickStatus(session, "cancelled"); }}
                                  disabled={isUpdating}
                                  className="size-8 grid place-items-center rounded-xl border-2 border-border text-foreground/40 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 cursor-pointer transition-colors disabled:opacity-50"
                                  aria-label="Cancel session"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Ban className="size-3" />
                                  )}
                                </button>
                              </>
                            )}

                            {(session.status === "completed" || session.status === "cancelled") && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); quickStatus(session, "scheduled"); }}
                                disabled={isUpdating}
                                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-xs font-bold text-foreground/60 hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                                aria-label="Reopen session"
                              >
                                {isUpdating ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="size-3" />
                                )}
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Progress summary */}
          {sessions.length > 0 && (
            <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{t("groupDetailPage.progress.title", { defaultValue: "Progress" })}</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground/70">{t("groupDetailPage.progress.sessionCompletion", { defaultValue: "Session completion" })}</span>
                  <span className="font-black">{completedCount}/{sessions.length}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(completedCount / sessions.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-foreground/50">
                  {t("groupDetailPage.progress.complete", { pct: Math.round((completedCount / sessions.length) * 100), defaultValue: `${Math.round((completedCount / sessions.length) * 100)}% complete` })}
                  {makeupCount > 0 ? ` ${t("groupDetailPage.progress.makeupSuffix", { count: makeupCount, defaultValue: `· ${makeupCount} makeup session${makeupCount > 1 ? "s" : ""}` })}` : ""}
                </p>
              </div>

              {progress && progress.totals.homeworkAssigned > 0 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground/70">{t("groupDetailPage.progress.homeworkSubmissions", { defaultValue: "Homework submissions" })}</span>
                    <span className="font-black">
                      {progress.totals.homeworkSubmitted}/{progress.totals.homeworkAssigned}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{
                        width: `${(progress.totals.homeworkSubmitted / progress.totals.homeworkAssigned) * 100}%`,
                      }}
                    />
                  </div>
                  {progress.totals.activitiesTotal > 0 && (
                    <p className="text-xs text-foreground/50">
                      {t("groupDetailPage.progress.activities", { count: progress.totals.activitiesTotal, defaultValue: `${progress.totals.activitiesTotal} activities across all sessions` })}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── Session dialog (add / edit) ─────────────────────────────────────── */}
      <Dialog open={sessionOpen} onOpenChange={(open) => { if (!sessionBusy) setSessionOpen(open); }}>
        <DialogContent className="max-w-lg rounded-3xl border-2 border-border bg-card p-6 chunky-shadow gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">
              {editingSession
                ? t("groupDetailPage.sessionDialog.titleEdit", { defaultValue: "Edit session" })
                : t("groupDetailPage.sessionDialog.titleAdd", { defaultValue: "Add session" })}
            </h2>
            <button
              type="button"
              onClick={() => { if (!sessionBusy) setSessionOpen(false); }}
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
                placeholder={t("groupDetailPage.sessionDialog.notesPlaceholder", { defaultValue: "Any notes for this session…" })}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none resize-none"
              />
            </FormField>

            <DialogActions
              onCancel={() => setSessionOpen(false)}
              onConfirm={submitSession}
              confirmLabel={
                sessionBusy
                  ? editingSession
                    ? t("groupDetailPage.sessionDialog.saving", { defaultValue: "Saving…" })
                    : t("groupDetailPage.sessionDialog.adding", { defaultValue: "Adding…" })
                  : editingSession
                    ? t("groupDetailPage.sessionDialog.confirmEdit", { defaultValue: "Save changes" })
                    : t("groupDetailPage.sessionDialog.confirmAdd", { defaultValue: "Add session" })
              }
              loading={sessionBusy}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Enroll dialog ──────────────────────────────────────────────────── */}
      <Dialog open={enrollOpen} onOpenChange={(open) => { if (!enrollMutation.isPending) { setEnrollOpen(open); if (!open) setEnrollId(""); } }}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-border bg-card p-6 chunky-shadow gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">{t("groupDetailPage.enrollDialog.title", { defaultValue: "Enroll student" })}</h2>
            <button
              type="button"
              onClick={() => { if (!enrollMutation.isPending) { setEnrollOpen(false); setEnrollId(""); } }}
              className="size-9 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-4">
            <FormField label={t("groupDetailPage.enrollDialog.fieldStudent", { defaultValue: "Student" })}>
              <select
                value={enrollId}
                onChange={(e) => setEnrollId(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">{t("groupDetailPage.enrollDialog.selectStudent", { defaultValue: "Select a student" })}</option>
                {availableStudents.map((m) => (
                  <option key={m.userId} value={String(m.userId)}>
                    {m.fullName ?? m.email ?? `Student #${m.userId}`}
                  </option>
                ))}
              </select>
            </FormField>
            {availableStudents.length === 0 && !staffQuery.isLoading && (
              <p className="text-xs text-foreground/60">{t("groupDetailPage.enrollDialog.noAvailable", { defaultValue: "No available students to enroll." })}</p>
            )}
            <DialogActions
              onCancel={() => { setEnrollOpen(false); setEnrollId(""); }}
              onConfirm={handleEnroll}
              confirmLabel={enrollMutation.isPending
                ? t("groupDetailPage.enrollDialog.confirming", { defaultValue: "Enrolling…" })
                : t("groupDetailPage.enrollDialog.confirm", { defaultValue: "Enroll student" })}
              loading={enrollMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function MeetingPill({ provider, url }: { provider: string | null | undefined; url: string }) {
  const Icon = PROVIDER_ICONS[provider ?? ""] ?? Link2;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground/70 hover:text-primary hover:border-primary/30 cursor-pointer transition-colors"
    >
      <Icon className="size-3" />
      {PROVIDER_LABELS[provider ?? ""] ?? "Join meeting"}
    </a>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "text-foreground/70",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
      <div className={`inline-flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2 ${color}`}>{icon}</div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-bold text-foreground">{label}:</span>{" "}
      <span className="text-foreground/70">{value}</span>
    </div>
  );
}

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
  onConfirm: () => void;
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
