import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, Users, BarChart3,
  GraduationCap, AlertTriangle, CheckCircle2, Loader2, Trash2,
  UserPlus, X, Shield, ClipboardList, UserCheck,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  useMemberProfile,
  useRemoveCompanyMember,
  useStudentGuardians,
  useGuardianChildren,
  useCreateStudentGuardian,
  type MemberProfile,
  type StudentEnrolledGroup,
  type AttendanceSummary,
  type HomeworkSummary,
  type StudentGuardianRecord,
  type CreateStudentGuardianInput,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";
import { isBackendApiEnabled, ApiError } from "@/lib/api/client";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.studentsPage.title")}` }] }),
  component: StudentDetailPage,
});

const AVATAR_COLORS = ["bg-green-500", "bg-teal-500", "bg-blue-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function pct(n: number) { return `${Math.round(n)}%`; }

const PROTO_STUDENT: MemberProfile = {
  generatedAt: new Date().toISOString(),
  person: {
    id: 201, fullName: "Begaim Omurzakova", email: "begaim@quest.kg", phoneNumber: "+996 555 987 654",
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

const PROTO_PARENT: MemberProfile = {
  generatedAt: new Date().toISOString(),
  person: {
    id: 204, fullName: "Ainura Kozhakova", email: "ainura@quest.kg", phoneNumber: "+996 700 111 222",
    role: "parent", roles: ["parent"], title: null, avatar: null, bio: null,
    createdAt: "2024-05-12T00:00:00Z", permissions: null,
  },
  summary: { avgProgress: 0, completed: 0, atRisk: 0, courses: 0, groups: 0, students: null },
  courses: [],
  groups: [],
  students: [],
  attendance: null,
  homework: null,
};

const PROTO_GUARDIANS: StudentGuardianRecord[] = [
  { id: 1, companyId: 1, studentId: 201, guardianUserId: 204, fullName: "Ainura Kozhakova", relationship: "mother", email: "ainura@quest.kg", phone: "+996 700 111 222", preferredChannel: "email", canReceiveProgressUpdates: true, canReceiveAttendanceUpdates: true, canReceiveHomeworkUpdates: false, consentStatus: "granted", notes: null, createdAt: "2024-05-12T00:00:00Z", updatedAt: "2024-05-12T00:00:00Z" },
];

function StudentDetailPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const locale = activeI18n.resolvedLanguage || activeI18n.language;
  const { studentId } = Route.useParams();
  const parsedId = Number(studentId);
  const validId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  const navigate = useNavigate();

  const { data: profile, isLoading } = useMemberProfile(isBackend ? validId : null);
  const { data: guardians, isLoading: guardiansLoading } = useStudentGuardians(
    isBackend && profile?.person.role === "student" ? validId : null
  );
  const { data: children, isLoading: childrenLoading } = useGuardianChildren(
    isBackend && profile?.person.role === "parent" ? validId : null
  );
  const removeMutation = useRemoveCompanyMember();
  const createGuardianMutation = useCreateStudentGuardian();

  const protoData = parsedId === 204 ? PROTO_PARENT : PROTO_STUDENT;
  const data = isBackend ? profile : protoData;
  const protoGuardians = parsedId === 201 ? PROTO_GUARDIANS : [];
  const guardianList: StudentGuardianRecord[] = isBackend ? (guardians ?? []) : protoGuardians;

  const primaryRole = data?.person.role ?? "student";
  const isParent = primaryRole === "parent";
  const isStudent = primaryRole === "student";

  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [guardianForm, setGuardianForm] = useState<Omit<CreateStudentGuardianInput, "studentId">>({
    fullName: "", email: "", phone: "", relationship: "", notes: "", sendInvite: true, sendEmail: true,
  });
  const [guardianSetupLink, setGuardianSetupLink] = useState<string | null>(null);

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const handleRemove = async () => {
    if (!confirm(t("studentsPage.actions.confirmRemove"))) return;
    try {
      if (isBackend && validId !== null) await removeMutation.mutateAsync({ userId: validId, role: primaryRole as "student" | "parent" });
      toast.success(t("studentsPage.toast.removed"));
      navigate({ to: "/students" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("studentsPage.toast.removeFailed"));
    }
  };

  const handleAddGuardian = async () => {
    if (!guardianForm.fullName) return;
    if (isBackend && validId !== null) {
      try {
        const result = await createGuardianMutation.mutateAsync({ studentId: validId, ...guardianForm });
        toast.success(t("studentsPage.toast.guardianAdded"));
        setShowAddGuardian(false);
        setGuardianForm({ fullName: "", email: "", phone: "", relationship: "", notes: "", sendInvite: true, sendEmail: true });
        if (result.onboarding?.setupLink) {
          setGuardianSetupLink(result.onboarding.setupLink);
        }
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : t("studentsPage.toast.guardianFailed"));
      }
    } else {
      toast.success(t("studentsPage.toast.guardianAddedPrototype"));
      setShowAddGuardian(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <BackLink />
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-muted animate-pulse" />
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell>
        <BackLink />
        <div className="bg-card border-2 border-border rounded-2xl p-10 text-center">
          <p className="font-black text-base mb-1">{t("studentsPage.notFound.title")}</p>
          <p className="text-sm text-foreground/50">{t("studentsPage.notFound.body")}</p>
        </div>
      </DashboardShell>
    );
  }

  const { person, summary } = data;
  const studentGroups = isStudent ? (data.groups as StudentEnrolledGroup[]) : [];

  return (
    <DashboardShell>
      <TopBar showStreak={false} />
      <BackLink className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground -mt-2 mb-1" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className={`size-16 rounded-2xl border-2 border-foreground/10 grid place-items-center text-white font-black text-xl shrink-0 ${avatarColor(person.id)}`}>
                {initials(person.fullName, person.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-lg leading-tight">{person.fullName ?? person.email ?? t("studentsPage.fallbackUser", { id: person.id })}</h1>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${isParent ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-green-100 text-green-800 border-green-200"}`}>
                    {t(isParent ? "studentsPage.roles.parent" : "studentsPage.roles.student")}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm font-medium border-t-2 border-dashed border-border pt-3">
              {person.email && <InfoLine icon={Mail} text={person.email} />}
              {person.phoneNumber && <InfoLine icon={Phone} text={person.phoneNumber} />}
              <InfoLine icon={Calendar} text={t("studentsPage.joined", { date: fmtDate(person.createdAt) })} />
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40 mb-1">{t("studentsPage.actions.title")}</p>
            <button onClick={handleRemove} disabled={removeMutation.isPending} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
              {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" strokeWidth={2.5} />}
              {t("studentsPage.actions.remove")}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {isStudent && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label={t("studentsPage.stats.enrolled")} value={summary.courses} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={BarChart3} label={t("studentsPage.stats.avgProgress")} value={pct(summary.avgProgress)} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={CheckCircle2} label={t("studentsPage.stats.completed")} value={summary.completed} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={AlertTriangle} label={t("studentsPage.stats.atRisk")} value={summary.atRisk} color="text-red-600" bg="bg-red-50" />
              </div>

              {(data.attendance || data.homework) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.attendance && <AttendanceCard a={data.attendance} />}
                  {data.homework && <HomeworkCard h={data.homework} />}
                </div>
              )}

              {studentGroups.length > 0 && (
                <DataSection title={t("studentsPage.sections.enrolledGroups")}>
                  <table className="w-full text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b-2 border-border">
                      <Th align="left">{t("studentsPage.table.courseGroup")}</Th>
                      <Th align="left" hide="sm">{t("studentsPage.table.instructor")}</Th>
                      <Th align="right">{t("studentsPage.table.progress")}</Th>
                      <Th />
                    </tr></thead>
                    <tbody className="divide-y-2 divide-border">
                      {studentGroups.map((g) => (
                        <tr key={g.groupId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3"><p className="font-bold">{g.courseTitle ?? `Course ${g.courseId}`}</p><p className="text-[11px] text-foreground/50">{g.groupName}</p></td>
                          <td className="px-4 py-3 hidden sm:table-cell text-xs font-medium text-foreground/60">{g.instructorName ?? "—"}</td>
                          <td className="px-5 py-3"><ProgressBar value={g.progressPercent} atRisk={g.atRisk} right /></td>
                          <td className="px-4 py-3 text-center"><StatusIcon completed={g.completed} atRisk={g.atRisk} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataSection>
              )}

              {/* Guardian section */}
              <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
                <div className="px-5 py-4 border-b-2 border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-orange-500" strokeWidth={2.5} />
                    <p className="font-black text-sm">{t("studentsPage.sections.guardians")}</p>
                    {!guardiansLoading && <span className="text-[11px] font-black px-1.5 py-0.5 rounded-lg bg-muted text-foreground/50">{guardianList.length}</span>}
                  </div>
                  <button onClick={() => setShowAddGuardian(true)} className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow">
                    <UserPlus className="size-3.5" strokeWidth={2.5} /> {t("studentsPage.guardians.add")}
                  </button>
                </div>
                {guardiansLoading ? (
                  <div className="p-5 space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : guardianList.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="size-8 text-foreground/20 mb-2 mx-auto" strokeWidth={1.5} />
                    <p className="text-sm font-bold text-foreground/50">{t("studentsPage.guardians.empty")}</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-border">
                    {guardianList.map((g) => (
                      <div key={g.id} className="px-5 py-4 flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-orange-100 border-2 border-orange-200 grid place-items-center shrink-0">
                          <Shield className="size-4 text-orange-600" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{g.fullName}</p>
                          <p className="text-[11px] text-foreground/50 font-medium">
                            {g.relationship && <span className="capitalize">{g.relationship} · </span>}
                            {g.email && <span>{g.email}</span>}
                            {g.phone && <span> · {g.phone}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                            g.consentStatus === "granted" ? "bg-green-100 text-green-800 border-green-200" :
                            g.consentStatus === "revoked" ? "bg-red-100 text-red-800 border-red-200" :
                            "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }`}>
                            {t(`studentsPage.guardians.consent.${g.consentStatus}`)}
                          </span>
                          {g.guardianUserId && (
                            <Link to="/students/$studentId" params={{ studentId: String(g.guardianUserId) }} className="text-xs font-bold text-foreground/40 hover:text-primary transition-colors">
                              {t("studentsPage.guardians.viewProfile")}
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isParent && (
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
              <div className="px-5 py-4 border-b-2 border-border flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" strokeWidth={2.5} />
                <p className="font-black text-sm">{t("studentsPage.parent.children")}</p>
                {!childrenLoading && <span className="text-[11px] font-black px-1.5 py-0.5 rounded-lg bg-muted text-foreground/50">{(children ?? []).length}</span>}
              </div>
              {childrenLoading ? (
                <div className="p-5 space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
              ) : (children ?? []).length === 0 ? (
                <div className="p-8 text-center">
                  <GraduationCap className="size-8 text-foreground/20 mb-2 mx-auto" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-foreground/50">{t("studentsPage.parent.childrenEmpty")}</p>
                  <p className="text-xs text-foreground/40 font-medium mt-1 max-w-xs mx-auto">{t("studentsPage.parent.childrenEmptyHint")}</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-border">
                  {(children ?? []).map((c) => (
                    <Link key={c.id} to="/students/$studentId" params={{ studentId: String(c.studentId) }} className="px-5 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                      <div className={`size-9 rounded-xl border-2 border-foreground/10 grid place-items-center text-white font-black text-sm shrink-0 ${avatarColor(c.studentId)}`}>
                        {initials(c.student?.fullName ?? null, c.student?.email ?? null)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{c.student?.fullName ?? t("studentsPage.fallbackUser", { id: c.studentId })}</p>
                        {c.student?.email && <p className="text-[11px] text-foreground/50 font-medium truncate">{c.student.email}</p>}
                      </div>
                      {c.relationship && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border bg-muted text-foreground/50 border-border shrink-0 capitalize">{c.relationship}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {guardianSetupLink && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setGuardianSetupLink(null)}>
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl chunky-shadow p-6 m-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg">{t("studentsPage.guardians.setupLinkTitle")}</p>
              <button onClick={() => setGuardianSetupLink(null)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="size-5" strokeWidth={2.5} /></button>
            </div>
            <p className="text-sm text-foreground/70">{t("studentsPage.guardians.setupLinkHint")}</p>
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-muted px-3 py-2">
              <span className="flex-1 text-xs font-mono truncate text-foreground/70">{guardianSetupLink}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(guardianSetupLink); toast.success(t("studentsPage.guardians.setupLinkCopied")); }}
                className="shrink-0 text-xs font-black px-2 py-1 rounded-lg bg-primary text-primary-foreground border border-foreground"
              >
                {t("studentsPage.guardians.copyLink")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddGuardian && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddGuardian(false)}>
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl chunky-shadow p-6 m-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg">{t("studentsPage.guardians.addTitle")}</p>
              <button onClick={() => setShowAddGuardian(false)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="size-5" strokeWidth={2.5} /></button>
            </div>
            <div className="space-y-3">
              <FormField label={t("studentsPage.guardians.fields.fullName")}>
                <input value={guardianForm.fullName} onChange={(e) => setGuardianForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder={t("studentsPage.guardians.fields.fullNamePlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </FormField>
              <FormField label={t("studentsPage.guardians.fields.relationship")}>
                <input value={guardianForm.relationship ?? ""} onChange={(e) => setGuardianForm((f) => ({ ...f, relationship: e.target.value }))}
                  placeholder={t("studentsPage.guardians.fields.relationshipPlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </FormField>
              <FormField label={t("studentsPage.guardians.fields.email")}>
                <input type="email" value={guardianForm.email ?? ""} onChange={(e) => setGuardianForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t("studentsPage.guardians.fields.emailPlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </FormField>
              <FormField label={t("studentsPage.guardians.fields.phone")}>
                <input value={guardianForm.phone ?? ""} onChange={(e) => setGuardianForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t("studentsPage.guardians.fields.phonePlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </FormField>
              {guardianForm.email && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={guardianForm.sendInvite ?? true} onChange={(e) => setGuardianForm((f) => ({ ...f, sendInvite: e.target.checked }))} className="rounded" />
                  <span className="text-xs font-bold text-foreground/70">{t("studentsPage.guardians.inviteAsParent")}</span>
                </label>
              )}
            </div>
            <button onClick={handleAddGuardian} disabled={createGuardianMutation.isPending || !guardianForm.fullName}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
              {createGuardianMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" strokeWidth={2.5} />}
              {t("studentsPage.guardians.addSubmit")}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function BackLink({ className = "flex items-center gap-1.5 text-sm font-bold text-foreground/50 hover:text-foreground mb-4" }: { className?: string }) {
  const { t } = useTranslation();
  return <Link to="/students" className={className}><ArrowLeft className="size-4" strokeWidth={2.5} /> {t("studentsPage.back")}</Link>;
}

function InfoLine({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return <div className="flex items-center gap-2 text-foreground/70"><Icon className="size-4 shrink-0 text-foreground/30" strokeWidth={2.5} /><span className="truncate">{text}</span></div>;
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow"><div className="px-5 py-4 border-b-2 border-border"><p className="font-black text-sm">{title}</p></div>{children}</div>;
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

function StatusIcon({ completed, atRisk }: { completed: boolean; atRisk: boolean }) {
  return completed ? <CheckCircle2 className="size-4 text-green-500 mx-auto" strokeWidth={2.5} /> : atRisk ? <AlertTriangle className="size-4 text-red-500 mx-auto" strokeWidth={2.5} /> : <span className="size-2 rounded-full bg-blue-400 block mx-auto" />;
}

function AttendanceCard({ a }: { a: AttendanceSummary }) {
  const { t } = useTranslation();
  return <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3"><div className="flex items-center gap-2"><div className="size-8 rounded-xl bg-blue-50 grid place-items-center"><UserCheck className="size-4 text-blue-600" strokeWidth={2.5} /></div><p className="font-black text-sm">{t("studentsPage.sections.attendance")}</p>{a.rate !== null && <span className={`ml-auto text-sm font-black ${a.rate >= 80 ? "text-green-600" : a.rate >= 60 ? "text-orange-500" : "text-red-600"}`}>{a.rate}%</span>}</div><div className="h-2 bg-muted rounded-full overflow-hidden border border-border"><div className="h-full rounded-full bg-blue-400" style={{ width: `${a.rate ?? 0}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><MiniStat label={t("studentsPage.attendance.attended")} value={a.attended} color="text-green-600" /><MiniStat label={t("studentsPage.attendance.missed")} value={a.missed} color="text-red-600" /><MiniStat label={t("studentsPage.attendance.late")} value={a.late} color="text-orange-500" /></div></div>;
}

function HomeworkCard({ h }: { h: HomeworkSummary }) {
  const { t } = useTranslation();
  return <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow space-y-3"><div className="flex items-center gap-2"><div className="size-8 rounded-xl bg-purple-50 grid place-items-center"><ClipboardList className="size-4 text-purple-600" strokeWidth={2.5} /></div><p className="font-black text-sm">{t("studentsPage.sections.homework")}</p>{h.approvalRate !== null && <span className={`ml-auto text-sm font-black ${h.approvalRate >= 75 ? "text-green-600" : h.approvalRate >= 50 ? "text-orange-500" : "text-red-600"}`}>{h.approvalRate}%</span>}</div><div className="h-2 bg-muted rounded-full overflow-hidden border border-border"><div className="h-full rounded-full bg-purple-400" style={{ width: `${h.approvalRate ?? 0}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><MiniStat label={t("studentsPage.homework.approved")} value={h.approved} color="text-green-600" /><MiniStat label={t("studentsPage.homework.missing")} value={h.missing} color="text-red-600" /><MiniStat label={t("studentsPage.homework.pending")} value={h.pending} color="text-orange-500" /></div></div>;
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><p className={`font-black text-base ${color}`}>{value}</p><p className="text-[10px] font-bold text-foreground/40">{label}</p></div>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">{label}</p>{children}</div>;
}
