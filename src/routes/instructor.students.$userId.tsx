import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, BarChart3,
  CheckCircle2, AlertTriangle, UserCheck, ClipboardList,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
import i18n from "@/lib/i18n";
import { useStudentLatestResult, type EnglishLevel } from "@/lib/assessment-api";

export const Route = createFileRoute("/instructor/students/$userId")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorStudentProfile.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Student Profile",
        }),
      },
    ],
  }),
  component: InstructorStudentDetailPage,
});

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-teal-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(date: string | null | undefined, language: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(language, { day: "numeric", month: "short", year: "numeric" });
}

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

function BackToStudentsLink() {
  const { t } = useTranslation();
  return (
    <Link to="/instructor/students" className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground -mt-2 mb-1">
      <ArrowLeft className="size-4" strokeWidth={2.5} /> {t("instructorStudentProfile.actions.backToStudents", { defaultValue: "Students" })}
    </Link>
  );
}

function InstructorStudentDetailPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { userId } = Route.useParams();
  const parsedUserId = Number(userId);
  const validUserId = Number.isFinite(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";

  const { data: profile, isLoading } = useMemberProfile(isBackend ? validUserId : null);
  const data = isBackend ? profile : PROTO;

  if (isLoading) {
    return (
      <DashboardShell>
        <BackToStudentsLink />
        <div className="space-y-4" aria-label={t("instructorStudentProfile.state.loading", { defaultValue: "Loading student profile…" })}>
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
        <BackToStudentsLink />
        <div className="bg-card border-2 border-border rounded-2xl p-10 text-center">
          <p className="font-black text-base mb-1">{t("instructorStudentProfile.empty.notFoundTitle", { defaultValue: "Student not found" })}</p>
          <p className="text-sm text-foreground/50">{t("instructorStudentProfile.empty.notFoundBody", { defaultValue: "This student may not be in your classes." })}</p>
        </div>
      </DashboardShell>
    );
  }

  const { person, summary } = data;
  const studentGroups = data.groups as StudentEnrolledGroup[];

  return (
    <DashboardShell>
      <TopBar showStreak={false} />
      <BackToStudentsLink />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className={`size-14 rounded-2xl border-2 border-foreground/10 grid place-items-center text-white font-black text-lg shrink-0 ${avatarColor(person.id)}`}>
                {initials(person.fullName, person.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-lg leading-tight">{person.fullName ?? person.email ?? t("instructorStudentProfile.labels.userFallback", { id: person.id, defaultValue: "User {{id}}" })}</h1>
                <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-lg border bg-green-100 text-green-800 border-green-200 mt-1.5">
                  {t("instructorStudentProfile.labels.student", { defaultValue: "Student" })}
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
                <span>{t("instructorStudentProfile.labels.joined", { date: fmtDate(person.createdAt, activeI18n.language), defaultValue: "Joined {{date}}" })}</span>
              </div>
            </div>
          </div>
          {isBackend && <EnglishLevelCard userId={person.id} />}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label={t("instructorStudentProfile.stats.enrolled", { defaultValue: "Enrolled" })} value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={BarChart3} label={t("instructorStudentProfile.stats.avgProgress", { defaultValue: "Avg progress" })} value={`${Math.round(summary.avgProgress)}%`} color="text-orange-600" bg="bg-orange-50" />
            <StatCard icon={CheckCircle2} label={t("instructorStudentProfile.stats.completed", { defaultValue: "Completed" })} value={summary.completed} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={AlertTriangle} label={t("instructorStudentProfile.stats.atRisk", { defaultValue: "At risk" })} value={summary.atRisk} color="text-red-600" bg="bg-red-50" />
          </div>

          {(data.attendance || data.homework) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.attendance && <AttendanceCard a={data.attendance} />}
              {data.homework && <HomeworkCard h={data.homework} />}
            </div>
          )}

          {studentGroups.length > 0 && (
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
              <div className="px-5 py-4 border-b-2 border-border">
                <p className="font-black text-sm">{t("instructorStudentProfile.sections.enrolledGroups", { defaultValue: "Enrolled groups" })}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                    <th className="text-left px-5 py-2.5">{t("instructorStudentProfile.table.courseGroup", { defaultValue: "Course · Group" })}</th>
                    <th className="text-left px-4 py-2.5 hidden sm:table-cell">{t("instructorStudentProfile.table.enrolled", { defaultValue: "Enrolled" })}</th>
                    <th className="text-right px-5 py-2.5">{t("instructorStudentProfile.table.progress", { defaultValue: "Progress" })}</th>
                    <th className="text-center px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {studentGroups.map((group) => (
                    <tr key={group.groupId} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold">{group.courseTitle ?? t("instructorStudentProfile.labels.courseFallback", { id: group.courseId, defaultValue: "Course {{id}}" })}</p>
                        <p className="text-[11px] text-foreground/50">{group.groupName}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[11px] text-foreground/50">
                        {fmtDate(group.enrolledAt, activeI18n.language)}
                      </td>
                      <td className="px-5 py-3">
                        <ProgressBar value={group.progressPercent} atRisk={group.atRisk} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {group.completed
                          ? <CheckCircle2 className="size-4 text-green-500 mx-auto" strokeWidth={2.5} />
                          : group.atRisk
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

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: LucideIcon; label: string; value: number | string; color: string; bg: string;
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
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-xl bg-blue-50 grid place-items-center">
          <UserCheck className="size-4 text-blue-600" strokeWidth={2.5} />
        </div>
        <p className="font-black text-sm">{t("instructorStudentProfile.attendance.title", { defaultValue: "Attendance" })}</p>
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
        <MiniStat label={t("instructorStudentProfile.attendance.attended", { defaultValue: "Attended" })} value={a.attended} color="text-green-600" />
        <MiniStat label={t("instructorStudentProfile.attendance.missed", { defaultValue: "Missed" })} value={a.missed} color="text-red-600" />
        <MiniStat label={t("instructorStudentProfile.attendance.late", { defaultValue: "Late" })} value={a.late} color="text-orange-500" />
      </div>
      {a.excused > 0 && (
        <p className="text-[11px] text-foreground/40 font-medium text-center">
          {t("instructorStudentProfile.attendance.excusedTotal", { excused: a.excused, total: a.total, defaultValue: "{{excused}} excused · {{total}} total" })}
        </p>
      )}
    </div>
  );
}

function HomeworkCard({ h }: { h: HomeworkSummary }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-xl bg-purple-50 grid place-items-center">
          <ClipboardList className="size-4 text-purple-600" strokeWidth={2.5} />
        </div>
        <p className="font-black text-sm">{t("instructorStudentProfile.homework.title", { defaultValue: "Homework" })}</p>
        {h.approvalRate !== null && (
          <span className={`ml-auto text-sm font-black ${h.approvalRate >= 75 ? "text-green-600" : h.approvalRate >= 50 ? "text-orange-500" : "text-red-600"}`}>
            {t("instructorStudentProfile.homework.approvedRate", { rate: h.approvalRate, defaultValue: "{{rate}}% approved" })}
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div className="h-full rounded-full bg-purple-400" style={{ width: `${h.approvalRate ?? 0}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label={t("instructorStudentProfile.homework.approved", { defaultValue: "Approved" })} value={h.approved} color="text-green-600" />
        <MiniStat label={t("instructorStudentProfile.homework.missing", { defaultValue: "Missing" })} value={h.missing} color="text-red-600" />
        <MiniStat label={t("instructorStudentProfile.homework.pending", { defaultValue: "Pending" })} value={h.pending} color="text-orange-500" />
      </div>
      {(h.rejected > 0 || h.needsRevision > 0) && (
        <p className="text-[11px] text-foreground/40 font-medium text-center">
          {t("instructorStudentProfile.homework.rejectedRevision", { rejected: h.rejected, needsRevision: h.needsRevision, defaultValue: "{{rejected}} rejected · {{needsRevision}} needs revision" })}
        </p>
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

const LEVEL_BADGE: Record<EnglishLevel, string> = {
  A0: "bg-muted text-foreground/60 border-border",
  A1: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  A2: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  B1: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  B2: "bg-primary/10 text-primary border-primary/30",
};

function EnglishLevelCard({ userId }: { userId: number }) {
  const { t, i18n: activeI18n } = useTranslation();
  const { data: result, isLoading } = useStudentLatestResult(userId);

  if (isLoading) {
    return <div className="h-20 rounded-2xl bg-muted animate-pulse" />;
  }
  if (!result) return null;

  const level = result.overallLevel as EnglishLevel;
  const badgeCls = LEVEL_BADGE[level] ?? LEVEL_BADGE.A0;
  const completedDate = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString(activeI18n.language, { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
          <GraduationCap className="size-4 text-primary" strokeWidth={2.5} />
        </div>
        <p className="font-black text-sm">{t("instructorStudentProfile.englishLevel.title", { defaultValue: "English Level" })}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center size-12 rounded-xl border-2 font-black text-lg ${badgeCls}`}>
          {level}
        </span>
        <div>
          <p className="font-black text-sm">{t(`assessment.result.levels.${level}`)}</p>
          {completedDate && (
            <p className="text-[11px] text-foreground/45 font-medium mt-0.5">
              {t("instructorStudentProfile.englishLevel.testedOn", { date: completedDate, defaultValue: "Tested {{date}}" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
