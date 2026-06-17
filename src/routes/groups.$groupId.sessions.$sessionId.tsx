import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  ArrowLeft, Calendar, CheckCheck, Ban, RotateCcw, Loader2,
  Users, BookMarked, ClipboardList, Video, FileText, Plus, X, Save, ExternalLink,
} from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useCourseGroup,
  useCourseGroupStudents,
  useGroupSessionDetail,
  useGroupSessionAttendance,
  useGroupSessionHomework,
  useMarkGroupSessionAttendance,
  useCreateGroupSessionHomework,
  useUpdateGroupSessionHomework,
  useUpdateCourseSession,
  type GroupSessionHomeworkInput,
} from "@/lib/lms-core-api";

export const Route = createFileRoute("/groups/$groupId/sessions/$sessionId")({
  head: () => ({ meta: [{ title: "QuestLMS — Session Detail" }] }),
  component: GroupSessionDetailPage,
});

const ACTIVITY_LABELS: Record<string, string> = {
  discussion: "Discussion", exercise: "Exercise", quiz: "Quiz",
  group_work: "Group Work", vocabulary: "Vocabulary", fill_blank: "Fill Blank",
  word_match: "Word Match", listening: "Listening", writing_correction: "Writing",
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: "text-foreground/60 bg-muted border-border",
  completed: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  cancelled: "text-red-500 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
};

const ATTENDANCE_OPTIONS = [
  { value: "present" as const, label: "P", title: "Present", style: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
  { value: "late" as const, label: "L", title: "Late", style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" },
  { value: "absent" as const, label: "A", title: "Absent", style: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
  { value: "excused" as const, label: "E", title: "Excused", style: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400" },
];

function GroupSessionDetailPage() {
  const { groupId, sessionId } = Route.useParams();
  const numericGroupId = Number(groupId);
  const numericSessionId = Number(sessionId);
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const validGroupId = backendEnabled && Number.isFinite(numericGroupId) ? numericGroupId : null;
  const validSessionId = backendEnabled && Number.isFinite(numericSessionId) ? numericSessionId : null;

  const groupQuery = useCourseGroup(validGroupId);
  const sessionQuery = useGroupSessionDetail(validSessionId);
  const studentsQuery = useCourseGroupStudents(validGroupId);
  const attendanceQuery = useGroupSessionAttendance(validSessionId);
  const homeworkQuery = useGroupSessionHomework(validSessionId);

  const updateSession = useUpdateCourseSession();
  const markAttendance = useMarkGroupSessionAttendance(validSessionId);
  const createHomework = useCreateGroupSessionHomework(validSessionId);
  const updateHomework = useUpdateGroupSessionHomework(validSessionId);

  const [tab, setTab] = useState<"overview" | "attendance" | "homework">("overview");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Attendance state
  const [attendanceMap, setAttendanceMap] = useState<Record<number, "present" | "absent" | "late" | "excused">>({});
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Material modal state
  const [materialOpen, setMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{ title: string; url: string } | null>(null);

  // Homework dialog state
  const [hwOpen, setHwOpen] = useState(false);
  const [hwId, setHwId] = useState<number | null>(null);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDue, setHwDue] = useState("");
  const [hwMax, setHwMax] = useState("");
  const [hwPublished, setHwPublished] = useState(true);
  const [hwSaving, setHwSaving] = useState(false);

  const session = sessionQuery.data;
  const group = groupQuery.data;
  const students = studentsQuery.data?.items ?? [];
  const homework = homeworkQuery.data ?? [];
  const activities = useMemo(() => (Array.isArray(session?.activities) ? session.activities : []), [session]);

  // Sync attendance from server when loaded (only if user hasn't made local changes)
  useEffect(() => {
    if (attendanceQuery.data && !attendanceDirty) {
      const map: Record<number, "present" | "absent" | "late" | "excused"> = {};
      for (const item of attendanceQuery.data.items) {
        map[item.userId] = item.status;
      }
      setAttendanceMap(map);
    }
  }, [attendanceQuery.data, attendanceDirty]);

  async function quickStatus(next: "scheduled" | "completed" | "cancelled") {
    if (!session) return;
    setStatusUpdating(true);
    try {
      await updateSession.mutateAsync({ sessionId: numericSessionId, groupId: numericGroupId, patch: { status: next } });
      toast.success(`Session marked as ${next}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  function setStudentAttendance(userId: number, status: "present" | "absent" | "late" | "excused") {
    setAttendanceMap((prev) => ({ ...prev, [userId]: status }));
    setAttendanceDirty(true);
  }

  async function saveAttendance() {
    setAttendanceSaving(true);
    try {
      const rows = students
        .filter((s) => s.userId != null)
        .map((s) => ({ studentId: s.userId, status: attendanceMap[s.userId] ?? "absent" }));
      await markAttendance.mutateAsync(rows);
      setAttendanceDirty(false);
      toast.success("Attendance saved");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setAttendanceSaving(false);
    }
  }

  function openAddHw() {
    setHwId(null); setHwTitle(""); setHwDesc(""); setHwDue(""); setHwMax(""); setHwPublished(true);
    setHwOpen(true);
  }

  function openEditHw(hw: (typeof homework)[number]) {
    setHwId(hw.id);
    setHwTitle(hw.title);
    setHwDesc(hw.description ?? "");
    setHwDue(hw.dueAt ? hw.dueAt.slice(0, 16) : "");
    setHwMax(hw.maxScore !== null ? String(hw.maxScore) : "");
    setHwPublished(hw.isPublished);
    setHwOpen(true);
  }

  async function submitHw() {
    if (!hwTitle.trim()) return toast.error("Title is required");
    setHwSaving(true);
    const input: GroupSessionHomeworkInput = {
      title: hwTitle.trim(),
      description: hwDesc.trim() || null,
      dueAt: hwDue ? new Date(hwDue).toISOString() : null,
      maxScore: hwMax ? Number(hwMax) : null,
      isPublished: hwPublished,
    };
    try {
      if (hwId !== null) {
        await updateHomework.mutateAsync({ homeworkId: hwId, patch: input });
        toast.success("Homework updated");
      } else {
        await createHomework.mutateAsync(input);
        toast.success("Homework created");
      }
      setHwOpen(false);
    } catch {
      toast.error("Failed to save homework");
    } finally {
      setHwSaving(false);
    }
  }

  if (sessionQuery.isLoading || groupQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 rounded-xl bg-card border-2 border-border animate-pulse" />
          <div className="h-44 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-10 w-72 rounded-2xl bg-card border-2 border-border animate-pulse" />
          <div className="h-64 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  if (!session) {
    return (
      <DashboardShell>
        <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-card p-10 text-center">
          <p className="font-bold text-destructive">Session not found</p>
          <Link to="/groups/$groupId" params={{ groupId }} className="text-sm text-primary font-bold hover:underline mt-2 inline-block">
            Back to group
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);
  const sessionNotes = (session as Record<string, unknown>).notes as string | null | undefined;
  const sessionMaterials = (session as Record<string, unknown>).materials as Array<{ title: string; url: string }> | null | undefined;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-4" />
          {group?.name ?? "Back to group"}
        </Link>

        {/* Session header card */}
        <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${STATUS_STYLE[session.status] ?? STATUS_STYLE.scheduled}`}
                >
                  {session.status}
                </span>
                {session.isMakeup && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    Makeup
                  </span>
                )}
                {group?.course?.title && (
                  <span className="text-[10px] font-bold text-foreground/40 truncate max-w-[160px]">
                    {group.course.title}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black mt-2 leading-tight">{session.title}</h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-foreground/60 font-medium">
                <Calendar className="size-4 shrink-0" />
                <span>
                  {startDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  {" · "}
                  {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" — "}
                  {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {session.location && (
                <p className="mt-1.5 text-xs text-foreground/50 font-medium">
                  📍 {session.location}
                </p>
              )}
              {sessionNotes && (
                <p className="mt-2.5 text-sm text-foreground/70 leading-relaxed border-t border-border/60 pt-2.5">
                  {sessionNotes}
                </p>
              )}
            </div>

            {/* Status action buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {session.status === "scheduled" && (
                <>
                  <button
                    type="button"
                    onClick={() => quickStatus("completed")}
                    disabled={statusUpdating}
                    className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-sm font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {statusUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStatus("cancelled")}
                    disabled={statusUpdating}
                    className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-sm font-bold text-foreground/60 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {statusUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                    Cancel
                  </button>
                </>
              )}
              {(session.status === "completed" || session.status === "cancelled") && (
                <button
                  type="button"
                  onClick={() => quickStatus("scheduled")}
                  disabled={statusUpdating}
                  className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-sm font-bold text-foreground/60 hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                >
                  {statusUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                  Reopen
                </button>
              )}
              {session.recordingUrl && (
                <a
                  href={session.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-sm font-bold text-foreground/60 hover:bg-muted cursor-pointer transition-colors"
                >
                  <Video className="size-3.5" />
                  Recording
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-2xl border-2 border-border w-fit">
          {(["overview", "attendance", "homework"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold capitalize transition-colors cursor-pointer ${
                tab === t
                  ? "bg-card border-2 border-border chunky-shadow text-foreground"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="space-y-4">
            {activities.length > 0 && (
              <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-4">
                  Activities · {activities.length}
                </h3>
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <ClipboardList className="size-4 text-primary/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{activity.title}</p>
                        <p className="text-xs text-foreground/50 capitalize">
                          {ACTIVITY_LABELS[activity.type] ?? activity.type}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                          activity.status === "active"
                            ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                            : "text-foreground/50 bg-muted border-border"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sessionMaterials && sessionMaterials.length > 0 && (
              <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-4">Materials</h3>
                <div className="space-y-1">
                  {sessionMaterials.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedMaterial(m); setMaterialOpen(true); }}
                      className="w-full flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      <FileText className="size-4 text-primary/60 shrink-0" />
                      <span className="text-sm font-bold flex-1 truncate">{m.title}</span>
                      <ExternalLink className="size-4 text-foreground/40" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {session.liveJoinUrl && (
              <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-3">Meeting</h3>
                <a
                  href={session.liveJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  <Video className="size-4" />
                  {session.liveProvider === "zoom"
                    ? "Join Zoom"
                    : session.liveProvider === "google_meet"
                    ? "Join Google Meet"
                    : "Join Meeting"}
                </a>
              </section>
            )}

            {activities.length === 0 && !sessionMaterials?.length && !session.liveJoinUrl && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
                <ClipboardList className="size-8 text-foreground/20" strokeWidth={1.5} />
                <p className="text-sm font-bold text-foreground/50">No activities or materials yet</p>
                <p className="text-xs text-foreground/40">Activities are managed in the session plan.</p>
              </div>
            )}
          </div>
        )}

        {/* Attendance tab */}
        {tab === "attendance" && (
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Attendance</h3>
              {attendanceDirty && (
                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={attendanceSaving}
                  className="h-8 px-4 inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold chunky-shadow hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-60"
                >
                  {attendanceSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Save attendance
                </button>
              )}
            </div>

            {attendanceQuery.isLoading || studentsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-foreground/30" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Users className="size-8 text-foreground/20" strokeWidth={1.5} />
                <p className="text-sm font-bold text-foreground/50">No students enrolled</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border-2 border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b-2 border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 w-8">#</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50">Student</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 hidden sm:table-cell">Email</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <span key={opt.value} className="flex items-center gap-1 text-[10px]">
                                <span className={`inline-flex items-center justify-center size-5 rounded-md text-[10px] font-black border ${opt.style}`}>{opt.label}</span>
                                <span className="hidden md:inline">{opt.title}</span>
                              </span>
                            ))}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((enrollment, index) => {
                        const currentStatus = attendanceMap[enrollment.userId];
                        return (
                          <tr key={enrollment.userId} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-foreground/40">{index + 1}</td>
                            <td className="px-4 py-3 font-bold">{enrollment.fullName ?? enrollment.email ?? "Unknown"}</td>
                            <td className="px-4 py-3 text-xs text-foreground/60 hidden sm:table-cell">
                              {enrollment.email && enrollment.fullName ? enrollment.email : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {ATTENDANCE_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStudentAttendance(enrollment.userId, opt.value)}
                                    title={opt.title}
                                    className={`size-8 rounded-xl border-2 text-[11px] font-black cursor-pointer transition-all ${
                                      currentStatus === opt.value
                                        ? opt.style
                                        : "border-border text-foreground/40 hover:border-foreground/30 hover:bg-muted"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {/* Homework tab */}
        {tab === "homework" && (
          <section className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Homework</h3>
              <button
                type="button"
                onClick={openAddHw}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold chunky-shadow hover:opacity-90 cursor-pointer transition-opacity"
              >
                <Plus className="size-3" /> Add
              </button>
            </div>

            {homeworkQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-foreground/30" />
              </div>
            ) : homework.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <BookMarked className="size-8 text-foreground/20" strokeWidth={1.5} />
                <p className="text-sm font-bold text-foreground/50">No homework yet</p>
                <button
                  type="button"
                  onClick={openAddHw}
                  className="mt-1 h-8 px-4 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted cursor-pointer transition-colors"
                >
                  <Plus className="size-3" /> Create first homework
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {homework.map((hw) => (
                  <div
                    key={hw.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => openEditHw(hw)}
                  >
                    <BookMarked className="size-4 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{hw.title}</p>
                      <p className="text-xs text-foreground/50">
                        {hw.dueAt
                          ? `Due ${new Date(hw.dueAt).toLocaleDateString()}`
                          : "No due date"}
                        {hw.maxScore !== null ? ` · ${hw.maxScore} pts` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                        hw.isPublished
                          ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                          : "text-foreground/50 bg-muted border-border"
                      }`}
                    >
                      {hw.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Material modal */}
      {materialOpen && selectedMaterial && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setMaterialOpen(false)}
        >
          <div
            className="w-full max-w-5xl bg-card border-2 border-border rounded-2xl chunky-shadow flex flex-col overflow-hidden"
            style={{ height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 text-primary/60 shrink-0" />
                <h2 className="text-base font-black truncate">{selectedMaterial.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedMaterial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-border text-xs font-bold text-foreground/60 hover:bg-muted transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => setMaterialOpen(false)}
                  className="size-8 grid place-items-center rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={selectedMaterial.url}
                title={selectedMaterial.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Homework dialog */}
      {hwOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setHwOpen(false)}
        >
          <div
            className="w-full max-w-md bg-card border-2 border-border rounded-2xl p-6 chunky-shadow space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">
                {hwId !== null ? "Edit Homework" : "New Homework"}
              </h2>
              <button
                type="button"
                onClick={() => setHwOpen(false)}
                className="size-8 grid place-items-center rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <HwField label="Title">
              <input
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
                placeholder="e.g. Practice exercises p.12"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
            </HwField>

            <HwField label="Description (optional)">
              <textarea
                value={hwDesc}
                onChange={(e) => setHwDesc(e.target.value)}
                placeholder="Instructions for students…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary resize-none"
              />
            </HwField>

            <div className="grid grid-cols-2 gap-3">
              <HwField label="Due date">
                <input
                  type="datetime-local"
                  value={hwDue}
                  onChange={(e) => setHwDue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </HwField>
              <HwField label="Max score">
                <input
                  type="number"
                  value={hwMax}
                  onChange={(e) => setHwMax(e.target.value)}
                  placeholder="100"
                  min={0}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary"
                />
              </HwField>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hwPublished}
                onChange={(e) => setHwPublished(e.target.checked)}
                className="size-4 rounded"
              />
              <span className="text-sm font-bold">Published (visible to students)</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHwOpen(false)}
                className="px-4 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitHw}
                disabled={hwSaving}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
              >
                {hwSaving && <Loader2 className="size-3.5 animate-spin" />}
                {hwId !== null ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function HwField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</span>
      {children}
    </label>
  );
}
