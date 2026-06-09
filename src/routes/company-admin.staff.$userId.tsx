import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, Users, BarChart3,
  GraduationCap, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
  Loader2, Trash2, ClipboardList, UserCheck, Clock, TrendingUp,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useMemberProfile,
  useUpdateMemberPermissions,
  useRemoveCompanyMember,
  type CompanyStaffRole,
  type MemberPermissions,
  type MemberProfile,
  type InstructorManagedGroup,
  type StudentEnrolledGroup,
  type AttendanceSummary,
  type HomeworkSummary,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled, ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/company-admin/staff/$userId")({
  head: () => ({ meta: [{ title: "QuestLMS — Member Profile" }] }),
  component: MemberDetailPage,
});

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<CompanyStaffRole, string> = {
  owner: "Owner", company_admin: "Admin", instructor: "Instructor",
  assistant: "Assistant", student: "Student", parent: "Parent",
};

const ROLE_COLORS: Record<CompanyStaffRole, string> = {
  owner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  company_admin: "bg-purple-100 text-purple-800 border-purple-200",
  instructor: "bg-blue-100 text-blue-800 border-blue-200",
  assistant: "bg-teal-100 text-teal-800 border-teal-200",
  student: "bg-green-100 text-green-800 border-green-200",
  parent: "bg-orange-100 text-orange-800 border-orange-200",
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-teal-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

function pct(n: number) { return `${Math.round(n)}%`; }

// ── prototype data ────────────────────────────────────────────────────────────

const PROTO_INSTRUCTOR: MemberProfile = {
  generatedAt: new Date().toISOString(),
  person: {
    id: 101, fullName: "Aris Bekov", email: "aris@quest.kg", phoneNumber: "+996 700 123 456",
    role: "instructor", roles: ["instructor"], title: "Senior Python Instructor",
    avatar: null, bio: "10 years of teaching Python, data science, and algorithms.",
    createdAt: "2024-01-10T00:00:00Z",
    permissions: { canCreateCourses: true, canCreateGroups: false },
  },
  summary: { avgProgress: 68, completed: 12, atRisk: 5, courses: 3, groups: 5, students: 48 },
  courses: [
    { courseId: 1, courseTitle: "Python Fundamentals", groupCount: 2, studentCount: 20, avgProgress: 72 },
    { courseId: 2, courseTitle: "Data Structures & Algorithms", groupCount: 2, studentCount: 18, avgProgress: 61 },
    { courseId: 3, courseTitle: "Web Scraping with Python", groupCount: 1, studentCount: 10, avgProgress: 80 },
  ],
  groups: [
    { groupId: 1, groupName: "Group A – Morning", status: "active", courseId: 1, courseTitle: "Python Fundamentals", courseType: "live", instructorId: 101, instructorName: "Aris Bekov", studentCount: 10, avgProgress: 72, completedStudents: 3, atRiskStudents: 2 },
    { groupId: 2, groupName: "Group B – Evening", status: "active", courseId: 1, courseTitle: "Python Fundamentals", courseType: "live", instructorId: 101, instructorName: "Aris Bekov", studentCount: 10, avgProgress: 65, completedStudents: 2, atRiskStudents: 1 },
    { groupId: 3, groupName: "Group A", status: "active", courseId: 2, courseTitle: "Data Structures & Algorithms", courseType: "live", instructorId: 101, instructorName: "Aris Bekov", studentCount: 9, avgProgress: 55, completedStudents: 1, atRiskStudents: 2 },
  ] as InstructorManagedGroup[],
  students: [
    { studentId: 201, fullName: "Aigerim N.", email: "aigerim@example.com", groupId: 1, groupName: "Group A – Morning", courseId: 1, courseTitle: "Python Fundamentals", progressPercent: 85, completed: false, atRisk: false },
    { studentId: 202, fullName: "Daniyar K.", email: "daniyar@example.com", groupId: 1, groupName: "Group A – Morning", courseId: 1, courseTitle: "Python Fundamentals", progressPercent: 18, completed: false, atRisk: true },
    { studentId: 203, fullName: "Zarina T.", email: "zarina@example.com", groupId: 2, groupName: "Group B – Evening", courseId: 2, courseTitle: "Data Structures", progressPercent: 55, completed: false, atRisk: false },
    { studentId: 204, fullName: "Manas A.", email: "manas@example.com", groupId: 3, groupName: "Group A", courseId: 2, courseTitle: "Data Structures", progressPercent: 12, completed: false, atRisk: true },
  ],
  attendance: null,
  homework: null,
};

const PROTO_STUDENT: MemberProfile = {
  generatedAt: new Date().toISOString(),
  person: {
    id: 105, fullName: "Begaim Omurzakova", email: "begaim@quest.kg", phoneNumber: "+996 555 987 654",
    role: "student", roles: ["student"], title: null, avatar: null, bio: null,
    createdAt: "2024-05-01T00:00:00Z", permissions: null,
  },
  summary: { avgProgress: 62, completed: 1, atRisk: 0, courses: 2, groups: 2, students: null },
  courses: [
    { courseId: 1, courseTitle: "Python Fundamentals", groupCount: 1, studentCount: 1, avgProgress: 72 },
    { courseId: 2, courseTitle: "Data Structures & Algorithms", groupCount: 1, studentCount: 1, avgProgress: 52 },
  ],
  groups: [
    { groupId: 1, groupName: "Group A – Morning", courseId: 1, courseTitle: "Python Fundamentals", instructorId: 101, instructorName: "Aris Bekov", progressPercent: 72, completed: false, atRisk: false, enrolledAt: "2024-05-03T00:00:00Z" },
    { groupId: 3, groupName: "Group A", courseId: 2, courseTitle: "Data Structures", instructorId: 101, instructorName: "Aris Bekov", progressPercent: 52, completed: false, atRisk: false, enrolledAt: "2024-05-10T00:00:00Z" },
  ] as StudentEnrolledGroup[],
  students: [],
  attendance: { total: 24, attended: 20, missed: 3, late: 2, excused: 1, rate: 83 },
  homework: { total: 18, submitted: 14, approved: 11, rejected: 1, needsRevision: 2, pending: 3, missing: 1, approvalRate: 79 },
};

// ── page ──────────────────────────────────────────────────────────────────────

function MemberDetailPage() {
  const { userId } = Route.useParams();
  const parsedUserId = Number(userId);
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  const navigate = useNavigate();

  const { data: profile, isLoading } = useMemberProfile(isBackend ? parsedUserId : null);
  const permissionsMutation = useUpdateMemberPermissions();
  const removeMutation = useRemoveCompanyMember();

  // prototype: pick instructor or student based on userId for demo
  const protoData = parsedUserId === 105 ? PROTO_STUDENT : PROTO_INSTRUCTOR;
  const data = isBackend ? profile : protoData;

  const primaryRole = (data?.person.role ?? data?.person.roles[0] ?? "instructor") as CompanyStaffRole;
  const isInstructor = primaryRole === "instructor" || primaryRole === "assistant";
  const isStudent = primaryRole === "student";

  const [pendingPerms, setPendingPerms] = useState<MemberPermissions | null>(null);
  const currentPerms = data?.person.permissions ?? {};
  const displayPerms = pendingPerms ?? currentPerms;

  const savePermission = async (key: keyof MemberPermissions, value: boolean) => {
    if (!isBackend) { toast.success("Permission updated (prototype)"); setPendingPerms((p) => ({ ...p, [key]: value })); return; }
    const next = { ...currentPerms, [key]: value };
    setPendingPerms(next);
    try {
      await permissionsMutation.mutateAsync({ userId: parsedUserId, permissions: next });
      toast.success("Permission saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save permission");
    } finally {
      setPendingPerms(null);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove this member from the workspace?")) return;
    try {
      if (isBackend) await removeMutation.mutateAsync({ userId: parsedUserId, role: primaryRole });
      toast.success("Member removed");
      navigate({ to: "/company-admin/staff" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <Link to="/company-admin/staff" className="flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4">
          <ArrowLeft className="size-4" strokeWidth={2.5} /> Members
        </Link>
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-muted animate-pulse" />
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="h-56 rounded-2xl bg-muted animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell>
        <Link to="/company-admin/staff" className="flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4">
          <ArrowLeft className="size-4" strokeWidth={2.5} /> Members
        </Link>
        <div className="bg-card border-2 border-border rounded-2xl p-10 text-center">
          <p className="font-black text-base mb-1">Member not found</p>
          <p className="text-sm text-foreground/50">This member may no longer be in your workspace.</p>
        </div>
      </DashboardShell>
    );
  }

  const { person, summary, courses, students } = data;
  const instructorGroups = isInstructor ? (data.groups as InstructorManagedGroup[]) : [];
  const studentGroups = isStudent ? (data.groups as StudentEnrolledGroup[]) : [];

  return (
    <DashboardShell>
      <TopBar showStreak={false} />

      <Link to="/company-admin/staff" className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground -mt-2 mb-1">
        <ArrowLeft className="size-4" strokeWidth={2.5} /> Members
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ── left sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* identity card */}
          <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className={`size-16 rounded-2xl border-2 border-foreground/10 grid place-items-center text-white font-black text-xl shrink-0 ${avatarColor(person.id)}`}>
                {initials(person.fullName, person.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-lg leading-tight">{person.fullName ?? person.email ?? `User ${person.id}`}</h1>
                {person.title && <p className="text-sm font-medium text-foreground/60 mt-0.5">{person.title}</p>}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {person.roles.map((r) => (
                    <span key={r} className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${ROLE_COLORS[r as CompanyStaffRole] ?? "bg-muted border-border text-foreground/60"}`}>
                      {ROLE_LABELS[r as CompanyStaffRole] ?? r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {person.bio && (
              <p className="text-sm font-medium text-foreground/70 border-t-2 border-dashed border-border pt-3">{person.bio}</p>
            )}

            <div className="space-y-2 text-sm font-medium border-t-2 border-dashed border-border pt-3">
              {person.email && (
                <div className="flex items-center gap-2 text-foreground/70">
                  <Mail className="size-4 shrink-0 text-foreground/30" strokeWidth={2.5} />
                  <span className="truncate">{person.email}</span>
                </div>
              )}
              {person.phoneNumber && (
                <div className="flex items-center gap-2 text-foreground/70">
                  <Phone className="size-4 shrink-0 text-foreground/30" strokeWidth={2.5} />
                  <span>{person.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-foreground/70">
                <Calendar className="size-4 shrink-0 text-foreground/30" strokeWidth={2.5} />
                <span>Joined {fmtDate(person.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* instructor permissions */}
          {primaryRole === "instructor" && (
            <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40">Permissions</p>
              <PermissionRow
                label="Can create courses"
                description="Instructor can create new courses in this workspace"
                enabled={!!displayPerms.canCreateCourses}
                loading={permissionsMutation.isPending}
                onToggle={(v) => savePermission("canCreateCourses", v)}
              />
              <PermissionRow
                label="Can create groups"
                description="Instructor can create and manage course groups"
                enabled={!!displayPerms.canCreateGroups}
                loading={permissionsMutation.isPending}
                onToggle={(v) => savePermission("canCreateGroups", v)}
              />
            </div>
          )}

          {/* actions */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40 mb-1">Actions</p>
            <button
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" strokeWidth={2.5} />}
              Remove from workspace
            </button>
          </div>
        </div>

        {/* ── right main area ───────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* ── INSTRUCTOR VIEW ─────────────────────────────────────────── */}
          {isInstructor && (
            <>
              {/* summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label="Courses" value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={Users} label="Groups" value={summary.groups} color="text-teal-600" bg="bg-teal-50" />
                <StatCard icon={GraduationCap} label="Students" value={summary.students ?? 0} color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={BarChart3} label="Avg progress" value={pct(summary.avgProgress)} color="text-orange-600" bg="bg-orange-50" />
              </div>

              {/* groups managed */}
              {instructorGroups.length > 0 && (
                <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
                  <div className="px-5 py-4 border-b-2 border-border flex items-center justify-between">
                    <p className="font-black text-sm">Groups managed</p>
                    {instructorGroups.some((g) => g.atRiskStudents > 0) && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="size-3" strokeWidth={2.5} />
                        {instructorGroups.reduce((s, g) => s + g.atRiskStudents, 0)} at risk
                      </span>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                        <th className="text-left px-5 py-2.5">Group · Course</th>
                        <th className="text-center px-4 py-2.5">Students</th>
                        <th className="text-center px-4 py-2.5 hidden sm:table-cell">Done</th>
                        <th className="text-center px-4 py-2.5 hidden sm:table-cell">At risk</th>
                        <th className="text-right px-5 py-2.5">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {instructorGroups.map((g) => (
                        <tr key={g.groupId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold">{g.groupName}</p>
                            <p className="text-[11px] text-foreground/50">{g.courseTitle ?? `Course ${g.courseId}`}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/60">
                              <Users className="size-3" strokeWidth={2.5} /> {g.studentCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            <span className="text-xs font-bold text-green-600">{g.completedStudents}</span>
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            {g.atRiskStudents > 0
                              ? <span className="text-xs font-black text-red-600">{g.atRiskStudents}</span>
                              : <span className="text-xs font-bold text-foreground/30">—</span>
                            }
                          </td>
                          <td className="px-5 py-3">
                            <ProgressBar value={g.avgProgress} atRisk={g.atRiskStudents > 0} right />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* courses overview */}
              {courses.length > 0 && (
                <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
                  <div className="px-5 py-4 border-b-2 border-border">
                    <p className="font-black text-sm">Courses taught</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                        <th className="text-left px-5 py-2.5">Course</th>
                        <th className="text-center px-4 py-2.5">Groups</th>
                        <th className="text-center px-4 py-2.5">Students</th>
                        <th className="text-right px-5 py-2.5">Avg progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {courses.map((c) => (
                        <tr key={c.courseId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-bold">{c.courseTitle ?? `Course ${c.courseId}`}</td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-foreground/60">{c.groupCount}</td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-foreground/60">{c.studentCount}</td>
                          <td className="px-5 py-3">
                            <ProgressBar value={c.avgProgress} right />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* students list */}
              {students.length > 0 && (
                <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
                  <div className="px-5 py-4 border-b-2 border-border flex items-center justify-between">
                    <p className="font-black text-sm">Students ({students.length})</p>
                    {students.some((s) => s.atRisk) && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="size-3" strokeWidth={2.5} />
                        {students.filter((s) => s.atRisk).length} at risk
                      </span>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                        <th className="text-left px-5 py-2.5">Student</th>
                        <th className="text-left px-4 py-2.5 hidden md:table-cell">Course · Group</th>
                        <th className="text-right px-5 py-2.5">Progress</th>
                        <th className="text-center px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {students.slice(0, 30).map((s) => (
                        <tr key={s.studentId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold">{s.fullName ?? `Student ${s.studentId}`}</p>
                            <p className="text-[11px] text-foreground/50">{s.email}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs font-medium text-foreground/60">
                            {s.courseTitle} <span className="text-foreground/30">·</span> {s.groupName}
                          </td>
                          <td className="px-5 py-3">
                            <ProgressBar value={s.progressPercent} atRisk={s.atRisk} right />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.completed
                              ? <CheckCircle2 className="size-4 text-green-500 mx-auto" strokeWidth={2.5} />
                              : s.atRisk
                                ? <AlertTriangle className="size-4 text-red-500 mx-auto" strokeWidth={2.5} />
                                : <span className="size-2 rounded-full bg-blue-400 block mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length > 30 && (
                    <div className="px-5 py-3 border-t-2 border-border text-xs font-bold text-foreground/40 text-center">
                      +{students.length - 30} more students
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── STUDENT VIEW ─────────────────────────────────────────────── */}
          {isStudent && (
            <>
              {/* summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label="Enrolled" value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={BarChart3} label="Avg progress" value={pct(summary.avgProgress)} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={CheckCircle2} label="Completed" value={summary.completed} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={AlertTriangle} label="At risk" value={summary.atRisk} color="text-red-600" bg="bg-red-50" />
              </div>

              {/* attendance + homework row */}
              {(data.attendance || data.homework) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.attendance && <AttendanceCard a={data.attendance} />}
                  {data.homework && <HomeworkCard h={data.homework} />}
                </div>
              )}

              {/* enrolled groups */}
              {studentGroups.length > 0 && (
                <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
                  <div className="px-5 py-4 border-b-2 border-border">
                    <p className="font-black text-sm">Enrolled groups</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                        <th className="text-left px-5 py-2.5">Course · Group</th>
                        <th className="text-left px-4 py-2.5 hidden sm:table-cell">Instructor</th>
                        <th className="text-left px-4 py-2.5 hidden md:table-cell">Enrolled</th>
                        <th className="text-right px-5 py-2.5">Progress</th>
                        <th className="text-center px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {studentGroups.map((g) => (
                        <tr key={g.groupId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold">{g.courseTitle ?? `Course ${g.courseId}`}</p>
                            <p className="text-[11px] text-foreground/50">{g.groupName}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-xs font-medium text-foreground/60">
                            {g.instructorName ?? "—"}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-[11px] text-foreground/50">
                            {fmtDate(g.enrolledAt)}
                          </td>
                          <td className="px-5 py-3">
                            <ProgressBar value={g.progressPercent} atRisk={g.atRisk} right />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {g.completed
                              ? <CheckCircle2 className="size-4 text-green-500 mx-auto" strokeWidth={2.5} />
                              : g.atRisk
                                ? <AlertTriangle className="size-4 text-red-500 mx-auto" strokeWidth={2.5} />
                                : <span className="size-2 rounded-full bg-blue-400 block mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </DashboardShell>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: typeof BookOpen; label: string; value: number | string; color: string; bg: string;
}) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
      <div className={`size-9 rounded-xl ${bg} grid place-items-center mb-2`}>
        <Icon className={`size-4 ${color}`} strokeWidth={2.5} />
      </div>
      <p className="font-black text-xl">{value}</p>
      <p className="text-[11px] font-bold text-foreground/50">{label}</p>
    </div>
  );
}

function ProgressBar({ value, atRisk, right }: { value: number; atRisk?: boolean; right?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-2 ${right ? "justify-end" : ""} w-full max-w-[140px] ${right ? "ml-auto" : ""}`}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all ${atRisk ? "bg-red-400" : "bg-gradient-to-r from-primary to-secondary"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[11px] font-black text-foreground/60 w-8 text-right shrink-0">{Math.round(clamped)}%</span>
    </div>
  );
}

function PermissionRow({ label, description, enabled, loading, onToggle }: {
  label: string; description: string; enabled: boolean; loading: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[11px] font-medium text-foreground/50">{description}</p>
      </div>
      <button
        onClick={() => !loading && onToggle(!enabled)}
        disabled={loading}
        className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-colors ${
          enabled ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-foreground/50"
        } disabled:opacity-50`}
      >
        {loading
          ? <Loader2 className="size-4 animate-spin" />
          : enabled
            ? <ToggleRight className="size-4" strokeWidth={2.5} />
            : <ToggleLeft className="size-4" strokeWidth={2.5} />
        }
        {enabled ? "On" : "Off"}
      </button>
    </div>
  );
}

function AttendanceCard({ a }: { a: AttendanceSummary }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-xl bg-blue-50 grid place-items-center">
          <UserCheck className="size-4 text-blue-600" strokeWidth={2.5} />
        </div>
        <p className="font-black text-sm">Attendance</p>
        {a.rate !== null && (
          <span className={`ml-auto text-sm font-black ${a.rate >= 80 ? "text-green-600" : a.rate >= 60 ? "text-orange-500" : "text-red-600"}`}>
            {a.rate}%
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div className="h-full rounded-full bg-blue-400" style={{ width: `${a.rate ?? 0}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Attended" value={a.attended} color="text-green-600" />
        <MiniStat label="Missed" value={a.missed} color="text-red-600" />
        <MiniStat label="Late" value={a.late} color="text-orange-500" />
      </div>
      {a.excused > 0 && (
        <p className="text-[11px] text-foreground/40 font-medium text-center">{a.excused} excused · {a.total} total sessions</p>
      )}
    </div>
  );
}

function HomeworkCard({ h }: { h: HomeworkSummary }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-xl bg-purple-50 grid place-items-center">
          <ClipboardList className="size-4 text-purple-600" strokeWidth={2.5} />
        </div>
        <p className="font-black text-sm">Homework</p>
        {h.approvalRate !== null && (
          <span className={`ml-auto text-sm font-black ${h.approvalRate >= 75 ? "text-green-600" : h.approvalRate >= 50 ? "text-orange-500" : "text-red-600"}`}>
            {h.approvalRate}% approved
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div className="h-full rounded-full bg-purple-400" style={{ width: `${h.approvalRate ?? 0}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Approved" value={h.approved} color="text-green-600" />
        <MiniStat label="Missing" value={h.missing} color="text-red-600" />
        <MiniStat label="Pending" value={h.pending} color="text-orange-500" />
      </div>
      {(h.rejected > 0 || h.needsRevision > 0) && (
        <p className="text-[11px] text-foreground/40 font-medium text-center">{h.rejected} rejected · {h.needsRevision} needs revision</p>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`font-black text-base ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-foreground/40">{label}</p>
    </div>
  );
}
