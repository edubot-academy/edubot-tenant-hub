import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, BarChart3,
  Users, CheckCircle2, AlertTriangle, UserCheck, ClipboardList,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useMemberProfile,
  type StudentEnrolledGroup,
  type AttendanceSummary,
  type HomeworkSummary,
  type MemberProfile,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled } from "@/lib/api/client";

export const Route = createFileRoute("/instructor/students/$userId")({
  head: () => ({ meta: [{ title: "QuestLMS — Student Profile" }] }),
  component: InstructorStudentDetailPage,
});

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── prototype data ────────────────────────────────────────────────────────────

const PROTO: MemberProfile = {
  generatedAt: new Date().toISOString(),
  person: {
    id: 201, fullName: "Aigerim Nurlanovna", email: "aigerim@example.com",
    phoneNumber: "+996 700 555 123", role: "student", roles: ["student"],
    title: null, avatar: null, bio: null,
    createdAt: "2024-05-03T00:00:00Z", permissions: null,
  },
  summary: { avgProgress: 74, completed: 1, atRisk: 0, courses: 2, groups: 2, students: null },
  courses: [
    { courseId: 1, courseTitle: "Python Fundamentals", groupCount: 1, studentCount: 1, avgProgress: 85 },
    { courseId: 2, courseTitle: "Data Structures", groupCount: 1, studentCount: 1, avgProgress: 63 },
  ],
  groups: [
    { groupId: 1, groupName: "Group A – Morning", courseId: 1, courseTitle: "Python Fundamentals", instructorId: 101, instructorName: "Aris Bekov", progressPercent: 85, completed: false, atRisk: false, enrolledAt: "2024-05-04T00:00:00Z" },
    { groupId: 3, groupName: "Group A", courseId: 2, courseTitle: "Data Structures", instructorId: 101, instructorName: "Aris Bekov", progressPercent: 63, completed: false, atRisk: false, enrolledAt: "2024-05-10T00:00:00Z" },
  ] as StudentEnrolledGroup[],
  students: [],
  attendance: { total: 20, attended: 17, missed: 2, late: 1, excused: 1, rate: 85 },
  homework: { total: 15, submitted: 13, approved: 11, rejected: 0, needsRevision: 2, pending: 2, missing: 0, approvalRate: 85 },
};

// ── page ──────────────────────────────────────────────────────────────────────

function InstructorStudentDetailPage() {
  const { userId } = Route.useParams();
  const parsedUserId = Number(userId);
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";

  const { data: profile, isLoading } = useMemberProfile(isBackend ? parsedUserId : null);
  const data = isBackend ? profile : PROTO;

  if (isLoading) {
    return (
      <DashboardShell>
        <Link to="/instructor/students" className="flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4">
          <ArrowLeft className="size-4" strokeWidth={2.5} /> Students
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
        <Link to="/instructor/students" className="flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4">
          <ArrowLeft className="size-4" strokeWidth={2.5} /> Students
        </Link>
        <div className="bg-card border-2 border-border rounded-2xl p-10 text-center">
          <p className="font-black text-base mb-1">Student not found</p>
          <p className="text-sm text-foreground/50">This student may not be in your classes.</p>
        </div>
      </DashboardShell>
    );
  }

  const { person, summary } = data;
  const studentGroups = data.groups as StudentEnrolledGroup[];

  return (
    <DashboardShell>
      <TopBar showStreak={false} />

      <Link to="/instructor/students" className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground -mt-2 mb-1">
        <ArrowLeft className="size-4" strokeWidth={2.5} /> Students
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* ── left: identity ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className={`size-14 rounded-2xl border-2 border-foreground/10 grid place-items-center text-white font-black text-lg shrink-0 ${avatarColor(person.id)}`}>
                {initials(person.fullName, person.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-lg leading-tight">{person.fullName ?? person.email ?? `User ${person.id}`}</h1>
                <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-lg border bg-green-100 text-green-800 border-green-200 mt-1.5">
                  Student
                </span>
              </div>
            </div>

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
        </div>

        {/* ── right: progress ──────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Enrolled" value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={BarChart3} label="Avg progress" value={`${Math.round(summary.avgProgress)}%`} color="text-orange-600" bg="bg-orange-50" />
            <StatCard icon={CheckCircle2} label="Completed" value={summary.completed} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={AlertTriangle} label="At risk" value={summary.atRisk} color="text-red-600" bg="bg-red-50" />
          </div>

          {/* attendance + homework */}
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
                    <th className="text-left px-4 py-2.5 hidden sm:table-cell">Enrolled</th>
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
                      <td className="px-4 py-3 hidden sm:table-cell text-[11px] text-foreground/50">
                        {fmtDate(g.enrolledAt)}
                      </td>
                      <td className="px-5 py-3">
                        <ProgressBar value={g.progressPercent} atRisk={g.atRisk} />
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

function ProgressBar({ value, atRisk }: { value: number; atRisk?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2 justify-end ml-auto w-full max-w-[140px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className={`h-full rounded-full ${atRisk ? "bg-red-400" : "bg-gradient-to-r from-primary to-secondary"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[11px] font-black text-foreground/60 w-8 text-right shrink-0">{Math.round(clamped)}%</span>
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
        <p className="text-[11px] text-foreground/40 font-medium text-center">{a.excused} excused · {a.total} total</p>
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
