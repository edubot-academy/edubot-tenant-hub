import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, Users, BarChart3,
  GraduationCap, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
  Loader2, Trash2, ClipboardList, UserCheck,
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
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/company-admin/staff/$userId")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.companyAdmin.memberProfile")}` }] }),
  component: MemberDetailPage,
});

const ROLE_COLORS: Record<CompanyStaffRole, string> = {
  owner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  company_admin: "bg-purple-100 text-purple-800 border-purple-200",
  instructor: "bg-blue-100 text-blue-800 border-blue-200",
  assistant: "bg-teal-100 text-teal-800 border-teal-200",
  student: "bg-green-100 text-green-800 border-green-200",
  parent: "bg-orange-100 text-orange-800 border-orange-200",
};

const AVATAR_COLORS = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function pct(n: number) { return `${Math.round(n)}%`; }

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

function MemberDetailPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const locale = activeI18n.resolvedLanguage || activeI18n.language;
  const { userId } = Route.useParams();
  const parsedUserId = Number(userId);
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  const navigate = useNavigate();

  const { data: profile, isLoading } = useMemberProfile(isBackend ? parsedUserId : null);
  const permissionsMutation = useUpdateMemberPermissions();
  const removeMutation = useRemoveCompanyMember();

  const protoData = parsedUserId === 105 ? PROTO_STUDENT : PROTO_INSTRUCTOR;
  const data = isBackend ? profile : protoData;
  const primaryRole = (data?.person.role ?? data?.person.roles[0] ?? "instructor") as CompanyStaffRole;
  const isInstructor = primaryRole === "instructor" || primaryRole === "assistant";
  const isStudent = primaryRole === "student";

  const [pendingPerms, setPendingPerms] = useState<MemberPermissions | null>(null);
  const currentPerms = data?.person.permissions ?? {};
  const displayPerms = pendingPerms ?? currentPerms;

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const roleLabel = (role: string) => t(`companyAdminStaffPage.roles.${role}`, { defaultValue: role });
  const fallbackUser = (id: number) => t("companyAdminMemberPage.fallbackUser", { id });
  const fallbackCourse = (id: number | null) => t("companyAdminMemberPage.fallbackCourse", { id: id ?? "—" });
  const fallbackStudent = (id: number) => t("companyAdminMemberPage.fallbackStudent", { id });

  const savePermission = async (key: keyof MemberPermissions, value: boolean) => {
    if (!isBackend) {
      toast.success(t("companyAdminMemberPage.toast.permissionPrototype"));
      setPendingPerms((p) => ({ ...p, [key]: value }));
      return;
    }
    const next = { ...currentPerms, [key]: value };
    setPendingPerms(next);
    try {
      await permissionsMutation.mutateAsync({ userId: parsedUserId, permissions: next });
      toast.success(t("companyAdminMemberPage.toast.permissionSaved"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("companyAdminMemberPage.toast.permissionFailed"));
    } finally {
      setPendingPerms(null);
    }
  };

  const handleRemove = async () => {
    if (!confirm(t("companyAdminMemberPage.actions.confirmRemove"))) return;
    try {
      if (isBackend) await removeMutation.mutateAsync({ userId: parsedUserId, role: primaryRole });
      toast.success(t("companyAdminMemberPage.toast.removed"));
      navigate({ to: "/company-admin/staff" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("companyAdminMemberPage.toast.removeFailed"));
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <BackLink label={t("companyAdminMemberPage.back")} />
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
        <BackLink label={t("companyAdminMemberPage.back")} />
        <div className="bg-card border-2 border-border rounded-2xl p-10 text-center">
          <p className="font-black text-base mb-1">{t("companyAdminMemberPage.notFound.title")}</p>
          <p className="text-sm text-foreground/50">{t("companyAdminMemberPage.notFound.body")}</p>
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
      <BackLink label={t("companyAdminMemberPage.back")} className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground -mt-2 mb-1" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className={`size-16 rounded-2xl border-2 border-foreground/10 grid place-items-center text-white font-black text-xl shrink-0 ${avatarColor(person.id)}`}>
                {initials(person.fullName, person.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-lg leading-tight">{person.fullName ?? person.email ?? fallbackUser(person.id)}</h1>
                {person.title && <p className="text-sm font-medium text-foreground/60 mt-0.5">{person.title}</p>}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {person.roles.map((r) => (
                    <span key={r} className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${ROLE_COLORS[r as CompanyStaffRole] ?? "bg-muted border-border text-foreground/60"}`}>
                      {roleLabel(r)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {person.bio && <p className="text-sm font-medium text-foreground/70 border-t-2 border-dashed border-border pt-3">{person.bio}</p>}

            <div className="space-y-2 text-sm font-medium border-t-2 border-dashed border-border pt-3">
              {person.email && <InfoLine icon={Mail} text={person.email} />}
              {person.phoneNumber && <InfoLine icon={Phone} text={person.phoneNumber} />}
              <InfoLine icon={Calendar} text={t("companyAdminMemberPage.joined", { date: fmtDate(person.createdAt) })} />
            </div>
          </div>

          {primaryRole === "instructor" && (
            <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40">{t("companyAdminMemberPage.permissions.title")}</p>
              <PermissionRow label={t("companyAdminMemberPage.permissions.canCreateCourses")} description={t("companyAdminMemberPage.permissions.canCreateCoursesDesc")} enabled={!!displayPerms.canCreateCourses} loading={permissionsMutation.isPending} onToggle={(v) => savePermission("canCreateCourses", v)} />
              <PermissionRow label={t("companyAdminMemberPage.permissions.canCreateGroups")} description={t("companyAdminMemberPage.permissions.canCreateGroupsDesc")} enabled={!!displayPerms.canCreateGroups} loading={permissionsMutation.isPending} onToggle={(v) => savePermission("canCreateGroups", v)} />
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40 mb-1">{t("companyAdminMemberPage.actions.title")}</p>
            <button onClick={handleRemove} disabled={removeMutation.isPending} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
              {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" strokeWidth={2.5} />}
              {t("companyAdminMemberPage.actions.remove")}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {isInstructor && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label={t("companyAdminMemberPage.stats.courses")} value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={Users} label={t("companyAdminMemberPage.stats.groups")} value={summary.groups} color="text-teal-600" bg="bg-teal-50" />
                <StatCard icon={GraduationCap} label={t("companyAdminMemberPage.stats.students")} value={summary.students ?? 0} color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={BarChart3} label={t("companyAdminMemberPage.stats.avgProgress")} value={pct(summary.avgProgress)} color="text-orange-600" bg="bg-orange-50" />
              </div>

              {instructorGroups.length > 0 && (
                <DataSection title={t("companyAdminMemberPage.sections.groupsManaged")} badge={instructorGroups.some((g) => g.atRiskStudents > 0) ? `${instructorGroups.reduce((s, g) => s + g.atRiskStudents, 0)} ${t("companyAdminMemberPage.stats.atRisk")}` : undefined}>
                  <table className="w-full text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border"><Th align="left">{t("companyAdminMemberPage.table.groupCourse")}</Th><Th>{t("companyAdminMemberPage.table.students")}</Th><Th hide="sm">{t("companyAdminMemberPage.table.done")}</Th><Th hide="sm">{t("companyAdminMemberPage.table.atRisk")}</Th><Th align="right">{t("companyAdminMemberPage.table.progress")}</Th></tr></thead>
                    <tbody className="divide-y-2 divide-border">
                      {instructorGroups.map((g) => <tr key={g.groupId} className="hover:bg-muted/40 transition-colors"><td className="px-5 py-3"><p className="font-bold">{g.groupName}</p><p className="text-[11px] text-foreground/50">{g.courseTitle ?? fallbackCourse(g.courseId)}</p></td><td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/60"><Users className="size-3" strokeWidth={2.5} /> {g.studentCount}</span></td><td className="px-4 py-3 text-center hidden sm:table-cell"><span className="text-xs font-bold text-green-600">{g.completedStudents}</span></td><td className="px-4 py-3 text-center hidden sm:table-cell">{g.atRiskStudents > 0 ? <span className="text-xs font-black text-red-600">{g.atRiskStudents}</span> : <span className="text-xs font-bold text-foreground/30">—</span>}</td><td className="px-5 py-3"><ProgressBar value={g.avgProgress} atRisk={g.atRiskStudents > 0} right /></td></tr>)}
                    </tbody>
                  </table>
                </DataSection>
              )}

              {courses.length > 0 && (
                <DataSection title={t("companyAdminMemberPage.sections.coursesTaught")}>
                  <table className="w-full text-sm"><thead><tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border"><Th align="left">{t("companyAdminMemberPage.table.course")}</Th><Th>{t("companyAdminMemberPage.table.groups")}</Th><Th>{t("companyAdminMemberPage.table.students")}</Th><Th align="right">{t("companyAdminMemberPage.table.progress")}</Th></tr></thead><tbody className="divide-y-2 divide-border">{courses.map((c) => <tr key={c.courseId} className="hover:bg-muted/40 transition-colors"><td className="px-5 py-3 font-bold">{c.courseTitle ?? fallbackCourse(c.courseId)}</td><td className="px-4 py-3 text-center text-xs font-bold text-foreground/60">{c.groupCount}</td><td className="px-4 py-3 text-center text-xs font-bold text-foreground/60">{c.studentCount}</td><td className="px-5 py-3"><ProgressBar value={c.avgProgress} right /></td></tr>)}</tbody></table>
                </DataSection>
              )}

              {students.length > 0 && (
                <DataSection title={t("companyAdminMemberPage.sections.students", { count: students.length })} badge={students.some((s) => s.atRisk) ? `${students.filter((s) => s.atRisk).length} ${t("companyAdminMemberPage.stats.atRisk")}` : undefined}>
                  <table className="w-full text-sm"><thead><tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border"><Th align="left">{t("companyAdminMemberPage.table.student")}</Th><Th align="left" hide="md">{t("companyAdminMemberPage.table.courseGroup")}</Th><Th align="right">{t("companyAdminMemberPage.table.progress")}</Th><Th /></tr></thead><tbody className="divide-y-2 divide-border">{students.slice(0, 30).map((s) => <tr key={s.studentId} className="hover:bg-muted/40 transition-colors"><td className="px-5 py-3"><p className="font-bold">{s.fullName ?? fallbackStudent(s.studentId)}</p><p className="text-[11px] text-foreground/50">{s.email}</p></td><td className="px-4 py-3 hidden md:table-cell text-xs font-medium text-foreground/60">{s.courseTitle} <span className="text-foreground/30">·</span> {s.groupName}</td><td className="px-5 py-3"><ProgressBar value={s.progressPercent} atRisk={s.atRisk} right /></td><td className="px-4 py-3 text-center"><StatusIcon completed={s.completed} atRisk={s.atRisk} /></td></tr>)}</tbody></table>
                  {students.length > 30 && <div className="px-5 py-3 border-t-2 border-border text-xs font-bold text-foreground/40 text-center">{t("companyAdminMemberPage.moreStudents", { count: students.length - 30 })}</div>}
                </DataSection>
              )}
            </>
          )}

          {isStudent && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label={t("companyAdminMemberPage.stats.enrolled")} value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={BarChart3} label={t("companyAdminMemberPage.stats.avgProgress")} value={pct(summary.avgProgress)} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={CheckCircle2} label={t("companyAdminMemberPage.stats.completed")} value={summary.completed} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={AlertTriangle} label={t("companyAdminMemberPage.stats.atRisk")} value={summary.atRisk} color="text-red-600" bg="bg-red-50" />
              </div>

              {(data.attendance || data.homework) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{data.attendance && <AttendanceCard a={data.attendance} />}{data.homework && <HomeworkCard h={data.homework} />}</div>}

              {studentGroups.length > 0 && (
                <DataSection title={t("companyAdminMemberPage.sections.enrolledGroups")}>
                  <table className="w-full text-sm"><thead><tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border"><Th align="left">{t("companyAdminMemberPage.table.courseGroup")}</Th><Th align="left" hide="sm">{t("companyAdminMemberPage.table.instructor")}</Th><Th align="left" hide="md">{t("companyAdminMemberPage.table.enrolled")}</Th><Th align="right">{t("companyAdminMemberPage.table.progress")}</Th><Th /></tr></thead><tbody className="divide-y-2 divide-border">{studentGroups.map((g) => <tr key={g.groupId} className="hover:bg-muted/40 transition-colors"><td className="px-5 py-3"><p className="font-bold">{g.courseTitle ?? fallbackCourse(g.courseId)}</p><p className="text-[11px] text-foreground/50">{g.groupName}</p></td><td className="px-4 py-3 hidden sm:table-cell text-xs font-medium text-foreground/60">{g.instructorName ?? "—"}</td><td className="px-4 py-3 hidden md:table-cell text-[11px] text-foreground/50">{fmtDate(g.enrolledAt)}</td><td className="px-5 py-3"><ProgressBar value={g.progressPercent} atRisk={g.atRisk} right /></td><td className="px-4 py-3 text-center"><StatusIcon completed={g.completed} atRisk={g.atRisk} /></td></tr>)}</tbody></table>
                </DataSection>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function BackLink({ label, className = "flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4" }: { label: string; className?: string }) {
  return <Link to="/company-admin/staff" className={className}><ArrowLeft className="size-4" strokeWidth={2.5} /> {label}</Link>;
}

function InfoLine({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return <div className="flex items-center gap-2 text-foreground/70"><Icon className="size-4 shrink-0 text-foreground/30" strokeWidth={2.5} /><span className="truncate">{text}</span></div>;
}

function StatusIcon({ completed, atRisk }: { completed: boolean; atRisk: boolean }) {
  return completed ? <CheckCircle2 className="size-4 text-green-500 mx-auto" strokeWidth={2.5} /> : atRisk ? <AlertTriangle className="size-4 text-red-500 mx-auto" strokeWidth={2.5} /> : <span className="size-2 rounded-full bg-blue-400 block mx-auto" />;
}

function DataSection({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow"><div className="px-5 py-4 border-b-2 border-border flex items-center justify-between"><p className="font-black text-sm">{title}</p>{badge && <span className="flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg"><AlertTriangle className="size-3" strokeWidth={2.5} />{badge}</span>}</div>{children}</div>;
}

function Th({ children, align = "center", hide }: { children?: React.ReactNode; align?: "left" | "center" | "right"; hide?: "sm" | "md" }) {
  const hidden = hide === "sm" ? " hidden sm:table-cell" : hide === "md" ? " hidden md:table-cell" : "";
  const text = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return <th className={`${text} px-4 py-2.5${hidden}`}>{children}</th>;
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: typeof BookOpen; label: string; value: number | string; color: string; bg: string }) {
  return <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow"><div className={`size-9 rounded-xl ${bg} grid place-items-center mb-2`}><Icon className={`size-4 ${color}`} strokeWidth={2.5} /></div><p className="font-black text-xl">{value}</p><p className="text-[11px] font-bold text-foreground/50">{label}</p></div>;
}

function ProgressBar({ value, atRisk, right }: { value: number; atRisk?: boolean; right?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  return <div className={`flex items-center gap-2 ${right ? "justify-end" : ""} w-full max-w-[140px] ${right ? "ml-auto" : ""}`}><div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border"><div className={`h-full rounded-full transition-all ${atRisk ? "bg-red-400" : "bg-gradient-to-r from-primary to-secondary"}`} style={{ width: `${clamped}%` }} /></div><span className="text-[11px] font-black text-foreground/60 w-8 text-right shrink-0">{Math.round(clamped)}%</span></div>;
}

function PermissionRow({ label, description, enabled, loading, onToggle }: { label: string; description: string; enabled: boolean; loading: boolean; onToggle: (v: boolean) => void }) {
  const { t } = useTranslation();
  return <div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-bold">{label}</p><p className="text-[11px] font-medium text-foreground/50">{description}</p></div><button onClick={() => !loading && onToggle(!enabled)} disabled={loading} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-colors ${enabled ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-foreground/50"} disabled:opacity-50`}>{loading ? <Loader2 className="size-4 animate-spin" /> : enabled ? <ToggleRight className="size-4" strokeWidth={2.5} /> : <ToggleLeft className="size-4" strokeWidth={2.5} />}{enabled ? t("commonStatus.on") : t("commonStatus.off")}</button></div>;
}

function AttendanceCard({ a }: { a: AttendanceSummary }) {
  const { t } = useTranslation();
  return <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3"><div className="flex items-center gap-2"><div className="size-8 rounded-xl bg-blue-50 grid place-items-center"><UserCheck className="size-4 text-blue-600" strokeWidth={2.5} /></div><p className="font-black text-sm">{t("companyAdminMemberPage.sections.attendance")}</p>{a.rate !== null && <span className={`ml-auto text-sm font-black ${a.rate >= 80 ? "text-green-600" : a.rate >= 60 ? "text-orange-500" : "text-red-600"}`}>{a.rate}%</span>}</div><div className="h-2 bg-muted rounded-full overflow-hidden border border-border"><div className="h-full rounded-full bg-blue-400" style={{ width: `${a.rate ?? 0}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><MiniStat label={t("companyAdminMemberPage.attendance.attended")} value={a.attended} color="text-green-600" /><MiniStat label={t("companyAdminMemberPage.attendance.missed")} value={a.missed} color="text-red-600" /><MiniStat label={t("companyAdminMemberPage.attendance.late")} value={a.late} color="text-orange-500" /></div>{a.excused > 0 && <p className="text-[11px] text-foreground/40 font-medium text-center">{t("companyAdminMemberPage.attendance.summary", { excused: a.excused, total: a.total })}</p>}</div>;
}

function HomeworkCard({ h }: { h: HomeworkSummary }) {
  const { t } = useTranslation();
  return <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3"><div className="flex items-center gap-2"><div className="size-8 rounded-xl bg-purple-50 grid place-items-center"><ClipboardList className="size-4 text-purple-600" strokeWidth={2.5} /></div><p className="font-black text-sm">{t("companyAdminMemberPage.sections.homework")}</p>{h.approvalRate !== null && <span className={`ml-auto text-sm font-black ${h.approvalRate >= 75 ? "text-green-600" : h.approvalRate >= 50 ? "text-orange-500" : "text-red-600"}`}>{t("companyAdminMemberPage.homework.approvedRate", { rate: h.approvalRate })}</span>}</div><div className="h-2 bg-muted rounded-full overflow-hidden border border-border"><div className="h-full rounded-full bg-purple-400" style={{ width: `${h.approvalRate ?? 0}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><MiniStat label={t("companyAdminMemberPage.homework.approved")} value={h.approved} color="text-green-600" /><MiniStat label={t("companyAdminMemberPage.homework.missing")} value={h.missing} color="text-red-600" /><MiniStat label={t("companyAdminMemberPage.homework.pending")} value={h.pending} color="text-orange-500" /></div>{(h.rejected > 0 || h.needsRevision > 0) && <p className="text-[11px] text-foreground/40 font-medium text-center">{t("companyAdminMemberPage.homework.summary", { rejected: h.rejected, needsRevision: h.needsRevision })}</p>}</div>;
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><p className={`font-black text-base ${color}`}>{value}</p><p className="text-[10px] font-bold text-foreground/40">{label}</p></div>;
}
