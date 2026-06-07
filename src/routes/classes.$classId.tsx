import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ArrowLeft, BookOpen, Plus, Users, Calendar, X, Trash2, Video, FileText, HelpCircle, ClipboardList, Radio, CalendarClock, CalendarRange, UserCheck, GraduationCap } from "lucide-react";
import { useTenantModel, useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useRole } from "@/lib/roles";
import { useCompanyStaff } from "@/lib/company-admin/staff-api";
import {
  useAcademicClass,
  useAcademicClassAttendanceSummary,
  useAcademicClassCourses,
  useAcademicClassReport,
  useAcademicClassStudents,
  useAcademicClassTimetable,
  useAddAcademicClassCourse,
  useAddAcademicClassStudent,
  useCreateAcademicSession,
  useRemoveAcademicClassCourse,
  useRemoveAcademicClassStudent,
  useTenantCourses,
  useUpdateAcademicSession,
  useCourseGroup,
  useCourseGroupStudents,
  useCourseGroupSessions,
  type AcademicSessionRecord,
} from "@/lib/lms-core-api";
import {
  useLms,
  coursesForClass,
  assignCourse,
  unassignCourse,
  createCourse,
  courseLessonCount,
  addClassLesson,
  deleteClassLesson,
  lessonsForClass,
  type LessonType,
  type ScheduledLesson,
  type Course,
} from "@/lib/lmsStore";
import { ScheduleDialog } from "@/components/lms/ScheduleDialog";
import { GroupScheduleDialog } from "@/components/lms/GroupScheduleDialog";
import { ClassAttendance } from "@/components/lms/ClassAttendance";

const LESSON_TYPES: { type: LessonType; label: string; icon: typeof Video }[] = [
  { type: "video", label: "Video", icon: Video },
  { type: "reading", label: "Reading", icon: FileText },
  { type: "quiz", label: "Quiz", icon: HelpCircle },
  { type: "assignment", label: "Assignment", icon: ClipboardList },
  { type: "live", label: "Live session", icon: Radio },
];

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({ meta: [{ title: "QuestLMS — Class" }] }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const tenantModel = useTenantModel();
  if (tenantModel === "academic") return <AcademicClassDetailPage />;
  return <CourseCenterClassDetailPage />;
}

function AcademicClassDetailPage() {
  const { classId } = Route.useParams();
  const { role } = useRole();
  const numericClassId = Number(classId);
  const canManageAcademicClass = role === "company_admin" || role === "owner";
  const classQuery = useAcademicClass(Number.isFinite(numericClassId) ? numericClassId : null);
  const coursesQuery = useAcademicClassCourses(Number.isFinite(numericClassId) ? numericClassId : null);
  const studentsQuery = useAcademicClassStudents(Number.isFinite(numericClassId) ? numericClassId : null);
  const timetableQuery = useAcademicClassTimetable(Number.isFinite(numericClassId) ? numericClassId : null);
  const attendanceQuery = useAcademicClassAttendanceSummary(Number.isFinite(numericClassId) ? numericClassId : null);
  const reportQuery = useAcademicClassReport(Number.isFinite(numericClassId) ? numericClassId : null);
  const companyStaffQuery = useCompanyStaff();
  const tenantCoursesQuery = useTenantCourses();
  const addStudentMutation = useAddAcademicClassStudent(Number.isFinite(numericClassId) ? numericClassId : null);
  const removeStudentMutation = useRemoveAcademicClassStudent(Number.isFinite(numericClassId) ? numericClassId : null);
  const addCourseMutation = useAddAcademicClassCourse(Number.isFinite(numericClassId) ? numericClassId : null);
  const removeCourseMutation = useRemoveAcademicClassCourse(Number.isFinite(numericClassId) ? numericClassId : null);
  const createSessionMutation = useCreateAcademicSession(Number.isFinite(numericClassId) ? numericClassId : null);
  const updateSessionMutation = useUpdateAcademicSession(Number.isFinite(numericClassId) ? numericClassId : null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSessionRecord | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [sessionCourseId, setSessionCourseId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionStartsAt, setSessionStartsAt] = useState("");
  const [sessionEndsAt, setSessionEndsAt] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionStatus, setSessionStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionLiveProvider, setSessionLiveProvider] = useState("");
  const [sessionLiveJoinUrl, setSessionLiveJoinUrl] = useState("");

  const activeStudentIds = new Set((studentsQuery.data?.items ?? []).filter((item) => item.status === "active").map((item) => item.studentId));
  const availableStudents = (companyStaffQuery.data ?? []).filter((member) => member.role === "student" && member.status === "active" && !activeStudentIds.has(member.userId));
  const assignedCourseIds = new Set((coursesQuery.data?.items ?? []).map((item) => item.courseId));
  const availableCourses = (tenantCoursesQuery.data?.items ?? []).filter((course) => !assignedCourseIds.has(course.id));
  const availableInstructors = (companyStaffQuery.data ?? []).filter((member) => member.role === "instructor" && member.status === "active");

  const resetSessionForm = () => {
    setEditingSession(null);
    setSessionCourseId("");
    setSessionTitle("");
    setSessionStartsAt("");
    setSessionEndsAt("");
    setSessionLocation("");
    setSessionStatus("scheduled");
    setSessionNotes("");
    setSessionLiveProvider("");
    setSessionLiveJoinUrl("");
  };

  const openCreateSessionDialog = () => {
    resetSessionForm();
    setSessionDialogOpen(true);
  };

  const openEditSessionDialog = (session: AcademicSessionRecord) => {
    setEditingSession(session);
    setSessionCourseId(String(session.academicClassCourseId));
    setSessionTitle(session.title);
    setSessionStartsAt(toDateTimeLocalValue(session.startsAt));
    setSessionEndsAt(toDateTimeLocalValue(session.endsAt));
    setSessionLocation(session.location ?? "");
    setSessionStatus(session.status);
    setSessionNotes(session.notes ?? "");
    setSessionLiveProvider(session.liveProvider ?? "");
    setSessionLiveJoinUrl(session.liveJoinUrl ?? "");
    setSessionDialogOpen(true);
  };

  const submitStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Select a student");
      return;
    }
    try {
      await addStudentMutation.mutateAsync(Number(selectedStudentId));
      setSelectedStudentId("");
      setStudentDialogOpen(false);
      toast.success("Student added to academic class");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add student");
    }
  };

  const submitCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Select a subject");
      return;
    }
    try {
      await addCourseMutation.mutateAsync({
        courseId: Number(selectedCourseId),
        instructorId: selectedInstructorId ? Number(selectedInstructorId) : null,
        term: selectedTerm.trim() || null,
      });
      setSelectedCourseId("");
      setSelectedInstructorId("");
      setSelectedTerm("");
      setCourseDialogOpen(false);
      toast.success("Subject assigned to academic class");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign subject");
    }
  };

  const submitSession = async () => {
    if (!sessionTitle.trim()) {
      toast.error("Session title is required");
      return;
    }
    if (!sessionStartsAt || !sessionEndsAt) {
      toast.error("Start and end time are required");
      return;
    }

    try {
      if (editingSession) {
        await updateSessionMutation.mutateAsync({
          sessionId: editingSession.id,
          patch: {
            title: sessionTitle.trim(),
            startsAt: new Date(sessionStartsAt).toISOString(),
            endsAt: new Date(sessionEndsAt).toISOString(),
            status: sessionStatus,
            location: sessionLocation.trim() || null,
            notes: sessionNotes.trim() || null,
            liveProvider: (sessionLiveProvider || null) as "zoom" | "google_meet" | "custom" | null,
            liveJoinUrl: sessionLiveJoinUrl.trim() || null,
          },
        });
        toast.success("Session updated");
      } else {
        if (!sessionCourseId) {
          toast.error("Select a subject");
          return;
        }
        await createSessionMutation.mutateAsync({
          classCourseId: Number(sessionCourseId),
          title: sessionTitle.trim(),
          startsAt: new Date(sessionStartsAt).toISOString(),
          endsAt: new Date(sessionEndsAt).toISOString(),
          status: sessionStatus,
          location: sessionLocation.trim() || null,
          notes: sessionNotes.trim() || null,
          liveProvider: (sessionLiveProvider || null) as "zoom" | "google_meet" | "custom" | null,
          liveJoinUrl: sessionLiveJoinUrl.trim() || null,
        });
        toast.success("Session created");
      }

      resetSessionForm();
      setSessionDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save session");
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={classQuery.data?.name ?? "Academic class"}
        subtitle={classQuery.data?.code ?? "Class subjects, timetable, and attendance."}
        showStreak={false}
      />

      <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> All classes
      </Link>

      {classQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
          <div className="h-96 rounded-3xl border-2 border-border bg-card animate-pulse" />
        </div>
      ) : classQuery.isError || !classQuery.data ? (
        <div className="border-2 border-dashed border-destructive/40 rounded-3xl p-10 text-center space-y-2">
          <p className="font-bold text-destructive">Class not found</p>
          <p className="text-sm text-foreground/60">This academic class could not be loaded.</p>
        </div>
      ) : (
        <>
          <div className="h-32 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-6 chunky-shadow flex items-end p-5">
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{classQuery.data.code}</p>
              <h2 className="text-2xl font-black">{classQuery.data.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard icon={<Users className="size-4" />} label="Students" value={String(classQuery.data.activeStudentCount ?? 0)} />
            <StatCard icon={<BookOpen className="size-4" />} label="Subjects" value={String(coursesQuery.data?.items.length ?? 0)} />
            <StatCard icon={<Calendar className="size-4" />} label="Attendance" value={attendanceQuery.data?.totals.attendanceRate == null ? "N/A" : `${attendanceQuery.data.totals.attendanceRate}%`} />
          </div>

          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-black">Subjects in this class</h3>
                {canManageAcademicClass ? (
                  <button
                    type="button"
                    onClick={() => setCourseDialogOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                  >
                    <Plus className="size-4" strokeWidth={3} /> Assign subject
                  </button>
                ) : (
                  <span className="text-xs font-bold text-foreground/60">Academic classes are managed by company admin.</span>
                )}
              </div>

              {coursesQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1].map((index) => <div key={index} className="h-32 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
                </div>
              ) : (coursesQuery.data?.items.length ?? 0) === 0 ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
                  <p className="font-bold">No subjects assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(coursesQuery.data?.items ?? []).map((item) => (
                    <div key={item.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{item.term ?? item.course?.courseType ?? "Course"}</p>
                          <h4 className="font-black text-base leading-tight">{item.course?.title ?? `Course #${item.courseId}`}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary">{item.status}</span>
                          {canManageAcademicClass ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await removeCourseMutation.mutateAsync(item.id);
                                  toast.success("Subject removed from academic class");
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Failed to remove subject");
                                }
                              }}
                              className="size-8 rounded-lg border-2 border-border text-foreground/70 hover:bg-muted"
                              aria-label="Remove subject"
                            >
                              <Trash2 className="mx-auto size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap className="size-3.5" /> {item.instructor?.fullName ?? item.instructor?.email ?? "Instructor pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-black">Roster</h3>
                {canManageAcademicClass ? (
                  <button
                    type="button"
                    onClick={() => setStudentDialogOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                  >
                    <Plus className="size-4" strokeWidth={3} /> Add student
                  </button>
                ) : null}
              </div>

              {studentsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((index) => <div key={index} className="h-24 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
                </div>
              ) : (studentsQuery.data?.items.length ?? 0) === 0 ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
                  <p className="font-bold">No students in this academic class yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(studentsQuery.data?.items ?? []).map((item) => (
                    <div key={item.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black text-base leading-tight">{item.student?.fullName ?? item.student?.email ?? `Student #${item.studentId}`}</h4>
                          <p className="text-xs text-foreground/60 font-medium">{item.student?.email ?? "No email"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary">{item.status}</span>
                          {canManageAcademicClass && item.status === "active" ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await removeStudentMutation.mutateAsync(item.studentId);
                                  toast.success("Student removed from academic class");
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Failed to remove student");
                                }
                              }}
                              className="size-8 rounded-lg border-2 border-border text-foreground/70 hover:bg-muted"
                              aria-label="Remove student"
                            >
                              <Trash2 className="mx-auto size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" />
                  <h3 className="text-lg font-black">Timetable</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground/60">{timetableQuery.data?.items.length ?? 0} sessions</span>
                  {canManageAcademicClass ? (
                    <button
                      type="button"
                      onClick={openCreateSessionDialog}
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground chunky-shadow hover:opacity-90"
                    >
                      <Plus className="size-4" strokeWidth={3} /> Schedule session
                    </button>
                  ) : null}
                </div>
              </div>

              {timetableQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => <div key={index} className="h-20 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
                </div>
              ) : (timetableQuery.data?.items.length ?? 0) === 0 ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-sm text-foreground/60">No timetable entries yet.</div>
              ) : (
                <div className="space-y-2">
                  {(timetableQuery.data?.items ?? []).map((session) => (
                    <div key={session.id} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to="/classes/$classId/sessions/$sessionId"
                            params={{ classId, sessionId: String(session.id) }}
                            className="font-black text-sm hover:text-primary"
                          >
                            {session.title}
                          </Link>
                          <p className="text-xs text-foreground/60 font-medium">{session.course?.title ?? `Course #${session.courseId}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/55">{session.status}</span>
                          {canManageAcademicClass ? (
                            <button
                              type="button"
                              onClick={() => openEditSessionDialog(session)}
                              className="rounded-lg border-2 border-border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-foreground/70 hover:bg-muted"
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-foreground/60">
                        <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" /> {new Date(session.startsAt).toLocaleString()}</span>
                        {session.location ? <span>{session.location}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-black">Attendance overview</h3>
              {attendanceQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((index) => <div key={index} className="h-28 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
                </div>
              ) : attendanceQuery.data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border-2 border-border bg-card p-5 chunky-shadow">
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Records</p>
                    <p className="mt-2 text-2xl font-black">{attendanceQuery.data.totals.attendanceRecordCount}</p>
                    <p className="mt-2 text-sm font-medium text-foreground/60">Present {attendanceQuery.data.totals.present} · Late {attendanceQuery.data.totals.late} · Absent {attendanceQuery.data.totals.absent}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-border bg-card p-5 chunky-shadow">
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Students tracked</p>
                    <p className="mt-2 text-2xl font-black">{attendanceQuery.data.students.length}</p>
                    <p className="mt-2 text-sm font-medium text-foreground/60">Overall attendance rate {attendanceQuery.data.totals.attendanceRate ?? 'N/A'}%</p>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-black">Class report</h3>
                <span className="text-xs font-bold text-foreground/60">
                  {reportQuery.data?.generatedAt ? `Updated ${new Date(reportQuery.data.generatedAt).toLocaleString()}` : "Report summary"}
                </span>
              </div>

              {reportQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((index) => <div key={index} className="h-28 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
                </div>
              ) : reportQuery.isError || !reportQuery.data ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-sm text-foreground/60">
                  Report data is not available for this academic class.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <ReportCard
                      label="Attendance"
                      value={reportQuery.data.summary.attendanceRate == null ? "N/A" : `${reportQuery.data.summary.attendanceRate}%`}
                      hint={`${reportQuery.data.summary.completedSessionCount}/${reportQuery.data.summary.sessionCount} sessions completed`}
                    />
                    <ReportCard
                      label="Homework submission"
                      value={reportQuery.data.summary.homeworkSubmissionRate == null ? "N/A" : `${reportQuery.data.summary.homeworkSubmissionRate}%`}
                      hint={reportQuery.data.summary.averageHomeworkScore == null ? "No graded homework yet" : `Avg score ${reportQuery.data.summary.averageHomeworkScore}`}
                    />
                    <ReportCard
                      label="Activity score"
                      value={reportQuery.data.summary.averageActivityScore == null ? "N/A" : `${reportQuery.data.summary.averageActivityScore}`}
                      hint={`${reportQuery.data.summary.activeCourseCount} active subjects`}
                    />
                    <ReportCard
                      label="Quiz score"
                      value={reportQuery.data.summary.averageQuizScore == null ? "N/A" : `${reportQuery.data.summary.averageQuizScore}`}
                      hint={`${reportQuery.data.summary.studentCount} students tracked`}
                    />
                  </div>

                  <div className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[780px] text-sm">
                        <thead className="bg-muted/60">
                          <tr className="text-left">
                            <th className="px-4 py-3 font-black">Student</th>
                            <th className="px-4 py-3 font-black">Attendance</th>
                            <th className="px-4 py-3 font-black">Homework</th>
                            <th className="px-4 py-3 font-black">Activities</th>
                            <th className="px-4 py-3 font-black">Quizzes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportQuery.data.students.map((student) => (
                            <tr key={student.enrollmentId} className="border-t border-border align-top">
                              <td className="px-4 py-3">
                                <div className="font-black">{student.fullName ?? student.email ?? `Student #${student.studentId}`}</div>
                                <div className="text-xs text-foreground/60">{student.email ?? "No email"}</div>
                              </td>
                              <td className="px-4 py-3 text-foreground/70">
                                <div className="font-bold">{student.attendance.rate == null ? "N/A" : `${student.attendance.rate}%`}</div>
                                <div className="text-xs">Present {student.attendance.present} · Late {student.attendance.late}</div>
                                <div className="text-xs">Absent {student.attendance.absent} · Excused {student.attendance.excused}</div>
                              </td>
                              <td className="px-4 py-3 text-foreground/70">
                                <div className="font-bold">{student.homework.submitted}/{student.homework.assigned}</div>
                                <div className="text-xs">Graded {student.homework.graded}</div>
                                <div className="text-xs">Avg {student.homework.averageScore ?? "—"}</div>
                              </td>
                              <td className="px-4 py-3 text-foreground/70">
                                <div className="font-bold">{student.activities.submitted}/{student.activities.assigned}</div>
                                <div className="text-xs">Graded {student.activities.graded}</div>
                                <div className="text-xs">Avg {student.activities.averageScore ?? "—"}</div>
                              </td>
                              <td className="px-4 py-3 text-foreground/70">
                                <div className="font-bold">{student.quizzes.passed}/{student.quizzes.assigned} passed</div>
                                <div className="text-xs">Attempts {student.quizzes.attempts}</div>
                                <div className="text-xs">Avg {student.quizzes.averageScore ?? "—"}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}

      {studentDialogOpen ? (
        <DialogShell title="Add student to academic class" onClose={() => setStudentDialogOpen(false)}>
          <FormField label="Student">
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
            >
              <option value="">Select a student</option>
              {availableStudents.map((member) => (
                <option key={member.userId} value={String(member.userId)}>
                  {member.fullName ?? member.email ?? `Student #${member.userId}`}
                </option>
              ))}
            </select>
          </FormField>
          <DialogActions onCancel={() => setStudentDialogOpen(false)} onConfirm={submitStudent} confirmLabel="Add student" />
        </DialogShell>
      ) : null}

      {courseDialogOpen ? (
        <DialogShell title="Assign subject to academic class" onClose={() => setCourseDialogOpen(false)}>
          <div className="space-y-4">
            <FormField label="Subject">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="">Select a subject</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Instructor">
              <select
                value={selectedInstructorId}
                onChange={(event) => setSelectedInstructorId(event.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="">Assign later</option>
                {availableInstructors.map((member) => (
                  <option key={member.userId} value={String(member.userId)}>
                    {member.fullName ?? member.email ?? `Instructor #${member.userId}`}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Term">
              <input
                value={selectedTerm}
                onChange={(event) => setSelectedTerm(event.target.value)}
                placeholder="e.g. Fall 2026"
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              />
            </FormField>
            <DialogActions onCancel={() => setCourseDialogOpen(false)} onConfirm={submitCourse} confirmLabel="Assign subject" />
          </div>
        </DialogShell>
      ) : null}

      {sessionDialogOpen ? (
        <DialogShell title={editingSession ? "Edit academic session" : "Schedule academic session"} onClose={() => setSessionDialogOpen(false)}>
          <div className="space-y-4">
            {!editingSession ? (
              <FormField label="Subject">
                <select
                  value={sessionCourseId}
                  onChange={(event) => setSessionCourseId(event.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                >
                  <option value="">Select a subject</option>
                  {(coursesQuery.data?.items ?? []).map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.course?.title ?? `Course #${item.courseId}`}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}
            <FormField label="Session title">
              <input
                value={sessionTitle}
                onChange={(event) => setSessionTitle(event.target.value)}
                placeholder="e.g. Algebra review"
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Starts at">
                <input
                  type="datetime-local"
                  value={sessionStartsAt}
                  onChange={(event) => setSessionStartsAt(event.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
              <FormField label="Ends at">
                <input
                  type="datetime-local"
                  value={sessionEndsAt}
                  onChange={(event) => setSessionEndsAt(event.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Status">
                <select
                  value={sessionStatus}
                  onChange={(event) => setSessionStatus(event.target.value as "scheduled" | "completed" | "cancelled")}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FormField>
              <FormField label="Location">
                <input
                  value={sessionLocation}
                  onChange={(event) => setSessionLocation(event.target.value)}
                  placeholder="Room or campus"
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Live provider">
                <select
                  value={sessionLiveProvider}
                  onChange={(event) => setSessionLiveProvider(event.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="custom">Custom</option>
                </select>
              </FormField>
              <FormField label="Join URL">
                <input
                  value={sessionLiveJoinUrl}
                  onChange={(event) => setSessionLiveJoinUrl(event.target.value)}
                  placeholder="https://"
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              />
            </FormField>
            <DialogActions onCancel={() => setSessionDialogOpen(false)} onConfirm={submitSession} confirmLabel={editingSession ? "Save session" : "Create session"} />
          </div>
        </DialogShell>
      ) : null}
    </DashboardShell>
  );
}

function CourseCenterGroupBackend({ groupId }: { groupId: number }) {
  const groupQuery = useCourseGroup(Number.isFinite(groupId) ? groupId : null);
  const studentsQuery = useCourseGroupStudents(Number.isFinite(groupId) ? groupId : null);
  const sessionsQuery = useCourseGroupSessions(Number.isFinite(groupId) ? groupId : null);
  const [tab, setTab] = useState<"sessions" | "students">("sessions");

  const group = groupQuery.data;
  const sessions = sessionsQuery.data ?? [];
  const students = studentsQuery.data?.items ?? [];

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
        <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to classes
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

      <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary mb-5">
        <ArrowLeft className="size-4" /> All classes
      </Link>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Students</p>
          <p className="mt-1 text-2xl font-black">{studentsQuery.data?.total ?? group.activeStudentCount ?? 0}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Avg progress</p>
          <p className="mt-1 text-2xl font-black text-primary">{avgProgress}%</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{completedSessions}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Upcoming</p>
          <p className="mt-1 text-2xl font-black">{upcomingSessions}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {(["sessions", "students"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                : "bg-card border-border hover:-translate-y-0.5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        sessionsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
            No sessions scheduled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow flex items-center gap-4">
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
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    session.status === "completed"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : session.status === "cancelled"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-muted text-foreground/60"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "students" && (
        studentsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-card border-2 border-border animate-pulse" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-foreground/60">
            No students enrolled yet.
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
              </div>
            ))}
          </div>
        )
      )}
    </DashboardShell>
  );
}


function CourseCenterClassDetailPage() {
  const { classId } = Route.useParams();
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  if (isBackend) return <CourseCenterGroupBackend groupId={Number(classId)} />;
  const state = useLms();
  const navigate = useNavigate();
  const coursesEnabled = state.hierarchy.coursesEnabled;
  const klass = state.classes.find((c) => c.id === classId);
  const assigned = useMemo(() => coursesForClass(state, classId), [state, classId]);
  const available = useMemo(
    () => state.courses.filter((c) => !assigned.some((a) => a.id === c.id)),
    [state.courses, assigned],
  );

  const [classLessonOpen, setClassLessonOpen] = useState(false);
  const [classLessonForm, setClassLessonForm] = useState<{ title: string; type: LessonType; durationMin: string }>({
    title: "", type: "video", durationMin: "",
  });
  const [scheduleTarget, setScheduleTarget] = useState<ScheduledLesson | null>(null);
  const [groupScheduleTarget, setGroupScheduleTarget] = useState<Course | null>(null);

  const scheduledLessons = useMemo(() => lessonsForClass(state, classId), [state, classId]);
  const sortedSchedule = useMemo(() => {
    const withDate = scheduledLessons.filter((sl) => sl.effective.startAt || sl.effective.dueAt);
    return withDate.sort((a, b) => {
      const ad = new Date(a.effective.startAt ?? a.effective.dueAt ?? 0).getTime();
      const bd = new Date(b.effective.startAt ?? b.effective.dueAt ?? 0).getTime();
      return ad - bd;
    });
  }, [scheduledLessons]);

  const submitClassLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classLessonForm.title.trim()) { toast.error("Lesson title is required"); return; }
    addClassLesson(classId, {
      title: classLessonForm.title.trim(),
      type: classLessonForm.type,
      durationMin: classLessonForm.durationMin ? Number(classLessonForm.durationMin) : undefined,
    });
    setClassLessonForm({ title: "", type: "video", durationMin: "" });
    setClassLessonOpen(false);
    toast.success("Lesson added");
  };

  const [assignOpen, setAssignOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string>("");
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", subject: "", description: "" });
  const [tab, setTab] = useState<"overview" | "attendance">("overview");

  if (!klass) {
    return (
      <DashboardShell>
        <TopBar title="Class not found" showStreak={false} />
        <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to classes
        </Link>
      </DashboardShell>
    );
  }

  const handleAssign = () => {
    if (!pickedId) {
      toast.error("Pick a course to assign");
      return;
    }
    assignCourse(classId, pickedId);
    setAssignOpen(false);
    setPickedId("");
    toast.success("Course assigned to class");
  };

  const handleCreateAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      toast.error("Course title is required");
      return;
    }
    const c = createCourse({
      title: newCourse.title.trim(),
      subject: newCourse.subject.trim() || undefined,
      description: newCourse.description.trim() || undefined,
    });
    assignCourse(classId, c.id);
    setNewCourse({ title: "", subject: "", description: "" });
    setNewCourseOpen(false);
    toast.success(`"${c.title}" created and assigned`);
    navigate({ to: "/courses/$courseId", params: { courseId: c.id } });
  };

  return (
    <DashboardShell>
      <TopBar title={klass.title} subtitle={`${klass.code} · ${klass.students} students`} showStreak={false} />

      <Link to="/classes" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> All classes
      </Link>

      <div className={`h-32 bg-gradient-to-br ${klass.color} rounded-3xl mb-6 chunky-shadow flex items-end p-5`}>
        <div className="text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{klass.code}</p>
          <h2 className="text-2xl font-black">{klass.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users className="size-4" />} label="Students" value={String(klass.students)} />
        <StatCard icon={<Calendar className="size-4" />} label="Next session" value={klass.nextSession} />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label={coursesEnabled ? "Assigned courses" : "Lessons"}
          value={String(coursesEnabled ? assigned.length : klass.lessons.length)}
        />
      </div>

      <div className="flex items-center gap-1 mb-6 p-1 rounded-2xl border-2 border-border bg-card w-fit">
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={<BookOpen className="size-3.5" />}>Overview</TabBtn>
        <TabBtn active={tab === "attendance"} onClick={() => setTab("attendance")} icon={<UserCheck className="size-3.5" />}>Attendance</TabBtn>
      </div>

      {tab === "overview" && (<div className="space-y-10">
      {coursesEnabled ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-black">Courses in this class</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewCourseOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border bg-card font-bold text-xs hover:bg-muted"
              >
                <Plus className="size-3.5" strokeWidth={3} /> New course
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
              >
                <BookOpen className="size-3.5" strokeWidth={3} /> Assign existing
              </button>
            </div>
          </div>

          {assigned.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">No courses assigned yet.</p>
              <p className="text-sm text-foreground/60">Assign one from the library or create a new course for this class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assigned.map((c) => (
                <div key={c.id} className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="flex-1 min-w-0 hover:opacity-80"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{c.subject ?? "Course"}</p>
                      <h4 className="font-black text-base leading-tight">{c.title}</h4>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGroupScheduleTarget(c)}
                        aria-label="Schedule course"
                        title="Schedule course"
                        className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70"
                      >
                        <CalendarRange className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          unassignCourse(classId, c.id);
                          toast.success("Course removed from class");
                        }}
                        aria-label="Remove course from class"
                        className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {c.description && <p className="text-xs text-foreground/60 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs font-bold text-foreground/60">{courseLessonCount(c)} lesson{courseLessonCount(c) === 1 ? "" : "s"}</span>
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="text-xs font-black text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-black">Lessons</h3>
            <button
              type="button"
              onClick={() => setClassLessonOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs chunky-shadow hover:opacity-90"
            >
              <Plus className="size-3.5" strokeWidth={3} /> Add lesson
            </button>
          </div>
          <p className="text-xs text-foreground/60">Courses are disabled for this tenant. Lessons attach directly to the class.</p>
          {klass.lessons.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center space-y-2">
              <p className="font-bold">No lessons yet.</p>
              <p className="text-sm text-foreground/60">Add your first lesson for this class.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {klass.lessons.map((l, i) => {
                const Icon = LESSON_TYPES.find((t) => t.type === l.type)?.icon ?? FileText;
                return (
                  <li key={l.id} className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl p-3 chunky-shadow">
                    <div className="size-7 grid place-items-center rounded-lg bg-muted text-foreground/70 text-xs font-black">{i + 1}</div>
                    <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{l.title}</p>
                      <p className="text-xs text-foreground/60 capitalize">{l.type}{l.durationMin ? ` · ${l.durationMin} min` : ""}</p>
                    </div>
                    <button type="button" onClick={() => { deleteClassLesson(classId, l.id); toast.success("Lesson removed"); }} aria-label="Delete lesson" className="cursor-pointer size-8 grid place-items-center rounded-lg border-2 border-border hover:bg-muted text-foreground/70">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      <section className="space-y-3 mt-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            <h3 className="text-lg font-black">Schedule</h3>
          </div>
          <span className="text-xs font-bold text-foreground/60">
            {sortedSchedule.length} of {scheduledLessons.length} lessons scheduled
          </span>
        </div>

        {scheduledLessons.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center text-sm text-foreground/60">
            Add lessons {coursesEnabled ? "to a course assigned to this class" : "to this class"} to schedule them.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSchedule.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Upcoming</p>
                {sortedSchedule.map((sl) => (
                  <ScheduleRow key={`${sl.courseId ?? "class"}-${sl.lesson.id}`} sl={sl} onEdit={() => setScheduleTarget(sl)} />
                ))}
              </div>
            )}
            {sortedSchedule.length < scheduledLessons.length && (
              <details className="group" {...(sortedSchedule.length === 0 ? { open: true } : {})}>
                <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground">
                  Unscheduled ({scheduledLessons.length - sortedSchedule.length}) — click to expand
                </summary>
                <div className="mt-2 space-y-2">
                  {scheduledLessons
                    .filter((sl) => !sl.effective.startAt && !sl.effective.dueAt)
                    .map((sl) => (
                      <ScheduleRow key={`${sl.courseId ?? "class"}-${sl.lesson.id}`} sl={sl} onEdit={() => setScheduleTarget(sl)} />
                    ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>
      </div>)}

      {tab === "attendance" && <ClassAttendance classId={classId} />}

      {classLessonOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setClassLessonOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitClassLesson}
            className="w-full max-w-lg bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Add lesson to class</h2>
              <button type="button" onClick={() => setClassLessonOpen(false)} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <FormField label="Title">
              <input value={classLessonForm.title} onChange={(e) => setClassLessonForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type">
                <select value={classLessonForm.type} onChange={(e) => setClassLessonForm((f) => ({ ...f, type: e.target.value as LessonType }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary">
                  {LESSON_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </FormField>
              <FormField label="Duration (min)">
                <input type="number" min={0} value={classLessonForm.durationMin} onChange={(e) => setClassLessonForm((f) => ({ ...f, durationMin: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setClassLessonOpen(false)} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">Save lesson</button>
            </div>
          </form>
        </div>
      )}

      {assignOpen && (
        <DialogShell title="Assign course" onClose={() => setAssignOpen(false)}>
          <FormField label="Course">
            <select value={pickedId} onChange={(e) => setPickedId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary">
              <option value="">Select a course</option>
              {available.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </FormField>
          <DialogActions onCancel={() => setAssignOpen(false)} onConfirm={handleAssign} confirmLabel="Assign" />
        </DialogShell>
      )}

      {newCourseOpen && (
        <DialogShell title="New course" onClose={() => setNewCourseOpen(false)}>
          <form onSubmit={handleCreateAndAssign} className="space-y-4">
            <FormField label="Title">
              <input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <FormField label="Subject">
              <input value={newCourse.subject} onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <FormField label="Description">
              <textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} className="w-full min-h-28 px-3 py-2.5 rounded-xl border-2 border-border bg-background font-medium text-sm focus:outline-none focus:border-primary" />
            </FormField>
            <DialogActions onCancel={() => setNewCourseOpen(false)} confirmLabel="Create course" />
          </form>
        </DialogShell>
      )}

      {scheduleTarget && (
        <ScheduleDialog
          open
          onClose={() => setScheduleTarget(null)}
          classId={classId}
          lessonId={scheduleTarget.lesson.id}
          lessonTitle={scheduleTarget.lesson.title}
          lessonType={scheduleTarget.lesson.type}
          initial={{
            classId,
            lessonId: scheduleTarget.lesson.id,
            startAt: scheduleTarget.effective.startAt ?? undefined,
            dueAt: scheduleTarget.effective.dueAt ?? undefined,
          }}
        />
      )}
      {groupScheduleTarget && (
        <GroupScheduleDialog
          open
          course={groupScheduleTarget}
          classId={classId}
          onClose={() => setGroupScheduleTarget(null)}
        />
      )}
    </DashboardShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <div className="flex items-center gap-2 text-foreground/60 text-xs font-black uppercase tracking-wider">{icon}{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-muted"}`}>
      {icon}
      {children}
    </button>
  );
}

function ScheduleRow({ sl, onEdit }: { sl: ScheduledLesson; onEdit: () => void }) {
  const rawDate = sl.effective.startAt ?? sl.effective.dueAt;
  const date = rawDate ? new Date(rawDate) : null;
  const dayLabel = !date
    ? "Unscheduled"
    : isToday(date)
      ? "Today"
      : isTomorrow(date)
        ? "Tomorrow"
        : format(date, "EEE, MMM d");
  const timeLabel = !date ? "No time yet" : format(date, "HH:mm");
  const late = Boolean(date && isPast(date));
  return (
    <button type="button" onClick={onEdit} className="w-full text-left rounded-2xl border-2 border-border bg-card p-4 chunky-shadow hover:border-foreground/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-sm">{sl.lesson.title}</p>
          <p className="text-xs text-foreground/60">{sl.courseTitle ?? "Class lesson"} · {sl.lesson.type}</p>
        </div>
        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${late ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
          {dayLabel}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-foreground/60">
        <Calendar className="size-3.5" /> {timeLabel}
      </div>
    </button>
  );
}

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer size-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DialogActions({ onCancel, onConfirm, confirmLabel }: { onCancel: () => void; onConfirm?: () => void; confirmLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="cursor-pointer px-4 py-2.5 rounded-2xl border-2 border-border font-bold text-sm hover:bg-muted">Cancel</button>
      <button type={onConfirm ? "button" : "submit"} onClick={onConfirm} className="cursor-pointer px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90">{confirmLabel}</button>
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

function ReportCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 chunky-shadow">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-2 text-sm text-foreground/60">{hint}</p>
    </div>
  );
}

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
