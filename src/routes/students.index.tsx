import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Search, UserPlus, X, Mail, LayoutGrid, List, Copy,
  Clock, ChevronRight, Send, Loader2, GraduationCap, Users, Shield,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import {
  type CompanyMemberRecord,
  type CompanyStaffRole,
  type InviteCompanyMemberInput,
  useCompanyStaff,
  useInviteCompanyMember,
  useCreateStudentGuardian,
  useRemoveCompanyMember,
  useResendCompanyInvitation,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/students/")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.studentsPage.title")}` }] }),
  component: StudentsPage,
});

const ROLE_COLORS: Record<"student" | "parent", string> = {
  student: "bg-green-100 text-green-800 border-green-200",
  parent: "bg-orange-100 text-orange-800 border-orange-200",
};

const LEARNER_ROLES: CompanyStaffRole[] = ["student", "parent"];

type LearnerFilter = "all" | "student" | "parent";

const FILTER_TABS: { key: LearnerFilter; labelKey: string }[] = [
  { key: "all", labelKey: "all" },
  { key: "student", labelKey: "student" },
  { key: "parent", labelKey: "parent" },
];

const PROTO_LEARNERS: CompanyMemberRecord[] = [
  { id: 10, userId: 201, companyId: 1, role: "student", status: "active", invitedByUserId: null, invitedAt: "2024-05-01T00:00:00Z", acceptedAt: "2024-05-01T00:00:00Z", createdAt: "2024-05-01T00:00:00Z", updatedAt: "2024-05-01T00:00:00Z", fullName: "Begaim Omurzakova", email: "begaim@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 11, userId: 202, companyId: 1, role: "student", status: "active", invitedByUserId: null, invitedAt: "2024-05-05T00:00:00Z", acceptedAt: "2024-05-05T00:00:00Z", createdAt: "2024-05-05T00:00:00Z", updatedAt: "2024-05-05T00:00:00Z", fullName: "Daniyar Kozhakov", email: "daniyar@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 12, userId: 203, companyId: 1, role: "student", status: "active", invitedByUserId: null, invitedAt: "2024-05-10T00:00:00Z", acceptedAt: "2024-05-10T00:00:00Z", createdAt: "2024-05-10T00:00:00Z", updatedAt: "2024-05-10T00:00:00Z", fullName: "Zarina Toktosunova", email: "zarina@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 13, userId: 204, companyId: 1, role: "parent", status: "active", invitedByUserId: null, invitedAt: "2024-05-12T00:00:00Z", acceptedAt: "2024-05-12T00:00:00Z", createdAt: "2024-05-12T00:00:00Z", updatedAt: "2024-05-12T00:00:00Z", fullName: "Ainura Kozhakova", email: "ainura@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 14, userId: 205, companyId: 1, role: "student", status: "invited", invitedByUserId: null, invitedAt: "2024-06-10T00:00:00Z", acceptedAt: null, createdAt: "2024-06-10T00:00:00Z", updatedAt: "2024-06-10T00:00:00Z", fullName: null, email: "manas@quest.kg", permissions: null, invitation: { status: "pending", setupLink: null, expiresAt: null, emailSent: true, sentAt: "2024-06-10T00:00:00Z" }, onboarding: { status: "not_started", setupRequired: true, setupCompleted: false, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
];

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["bg-green-500", "bg-teal-500", "bg-blue-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function StudentsPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";
  const locale = activeI18n.resolvedLanguage || activeI18n.language;

  const { data: backendData, isLoading, refetch: refetchStaff } = useCompanyStaff(LEARNER_ROLES);
  const inviteMutation = useInviteCompanyMember();
  const createGuardianMutation = useCreateStudentGuardian();
  const removeMutation = useRemoveCompanyMember();
  const resendMutation = useResendCompanyInvitation();

  const allMembers = isBackend ? (backendData ?? []) : PROTO_LEARNERS;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<LearnerFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteCompanyMemberInput>({ fullName: "", email: "", role: "student", sendEmail: true });
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
  const [inviteSetupLink, setInviteSetupLink] = useState<string | null>(null);

  const isEffectivelyActive = (m: CompanyMemberRecord) =>
    m.status === "active" ||
    m.status === "suspended" ||
    m.invitation?.status === "completed" ||
    m.onboarding.status === "completed";

  const active = allMembers.filter(isEffectivelyActive);
  const pending = allMembers.filter((m) => !isEffectivelyActive(m));

  const filtered = active.filter((m) => {
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (m.fullName ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const roleCounts = allMembers.reduce<Record<string, number>>((acc, m) => {
    if (m.status === "active") acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});

  const isParentInvite = inviteForm.role === "parent";
  const studentMembers = allMembers.filter((m) => m.role === "student");
  const canSubmitInvite = !!inviteForm.email && !!inviteForm.fullName && (!isParentInvite || !!selectedStudentId);

  const handleInvite = async () => {
    if (!canSubmitInvite) return;
    if (isBackend) {
      try {
        let setupLink: string | null = null;
        if (isParentInvite && selectedStudentId) {
          const result = await createGuardianMutation.mutateAsync({
            studentId: selectedStudentId as number,
            fullName: inviteForm.fullName,
            email: inviteForm.email,
            sendInvite: true,
            sendEmail: inviteForm.sendEmail,
          });
          setupLink = result.onboarding?.setupLink ?? null;
        } else {
          const result = await inviteMutation.mutateAsync(inviteForm);
          setupLink = result.onboarding?.setupLink ?? null;
        }
        toast.success(t("studentsPage.toast.invited"));
        setShowInvite(false);
        setInviteForm({ fullName: "", email: "", role: "student", sendEmail: true });
        setSelectedStudentId("");
        if (setupLink) setInviteSetupLink(setupLink);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : t("studentsPage.toast.inviteFailed"));
      }
    } else {
      toast.success(t("studentsPage.toast.invitedPrototype"));
      setShowInvite(false);
    }
  };

  const handleResend = async (m: CompanyMemberRecord) => {
    if (!isBackend) { toast.success(t("studentsPage.toast.resentPrototype")); return; }
    try {
      const result = await resendMutation.mutateAsync({ userId: m.userId });
      toast.success(t("studentsPage.toast.resent"));
      if (result.onboarding?.setupLink) setInviteSetupLink(result.onboarding.setupLink);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("studentsPage.toast.resendFailed"));
      refetchStaff();
    }
  };

  const handleRevoke = async (m: CompanyMemberRecord) => {
    if (!isBackend) { toast.success(t("studentsPage.toast.revokedPrototype")); return; }
    try {
      await removeMutation.mutateAsync({ userId: m.userId, role: m.role });
      toast.success(t("studentsPage.toast.revoked"));
    } catch { toast.error(t("studentsPage.toast.revokeFailed")); }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return t("studentsPage.pending.justNow");
    return new Intl.DateTimeFormat(locale).format(new Date(value));
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("studentsPage.topbar.title")}
        subtitle={t("studentsPage.topbar.subtitle", { students: roleCounts["student"] ?? 0, parents: roleCounts["parent"] ?? 0 })}
        showStreak={false}
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" strokeWidth={2.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("studentsPage.search.placeholder")}
              className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-border bg-card text-sm font-medium focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button aria-label={t("staffPage.view.grid")} onClick={() => setViewMode("grid")} className={`p-2 rounded-xl border-2 transition-colors ${viewMode === "grid" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
              <LayoutGrid className="size-4" strokeWidth={2.5} />
            </button>
            <button aria-label={t("staffPage.view.list")} onClick={() => setViewMode("list")} className={`p-2 rounded-xl border-2 transition-colors ${viewMode === "list" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
              <List className="size-4" strokeWidth={2.5} />
            </button>
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow text-sm font-black">
              <UserPlus className="size-4" strokeWidth={2.5} /> {t("studentsPage.actions.invite")}
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTER_TABS.map(({ key, labelKey }) => {
            const count = key === "all" ? active.length : (roleCounts[key] ?? 0);
            const isActive = roleFilter === key;
            return (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap border-2 transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/60"}`}
              >
                {t(`studentsPage.tabs.${labelKey}`)}
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/60"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        )}

        {!isLoading && (
          viewMode === "grid"
            ? <LearnersGrid members={filtered} locale={locale} />
            : <LearnersList members={filtered} locale={locale} />
        )}

        {pending.filter((m) => roleFilter === "all" || m.role === roleFilter).length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40 mb-3">
              {t("studentsPage.pending.title", { count: pending.filter((m) => roleFilter === "all" || m.role === roleFilter).length })}
            </p>
            <div className="space-y-2">
              {pending.filter((m) => roleFilter === "all" || m.role === roleFilter).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-border bg-card">
                  <div className="size-9 rounded-xl bg-muted border-2 border-border grid place-items-center">
                    <Mail className="size-4 text-foreground/40" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{m.email}</p>
                    <p className="text-[11px] text-foreground/50 font-medium flex items-center gap-1">
                      <Clock className="size-3" /> {m.invitedAt ? formatDate(m.invitedAt) : t("studentsPage.pending.justNow")} · <RoleBadge role={m.role as "student" | "parent"} />
                    </p>
                  </div>
                  <button onClick={() => handleResend(m)} disabled={resendMutation.isPending} className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-border bg-muted hover:bg-muted/70 flex items-center gap-1.5">
                    <Send className="size-3" strokeWidth={2.5} /> {t("studentsPage.actions.resend")}
                  </button>
                  <button onClick={() => handleRevoke(m)} disabled={removeMutation.isPending} className="p-1.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" aria-label={t("studentsPage.toast.revoked")}>
                    <X className="size-4" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl chunky-shadow p-6 m-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg">{t("studentsPage.invite.title")}</p>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="size-5" strokeWidth={2.5} /></button>
            </div>
            <div className="space-y-3">
              <InviteField label={t("studentsPage.invite.fullName")}>
                <input value={inviteForm.fullName} onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder={t("studentsPage.invite.fullNamePlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </InviteField>
              <InviteField label={t("studentsPage.invite.email")}>
                <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t("studentsPage.invite.emailPlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </InviteField>
              <InviteField label={t("studentsPage.invite.role")}>
                <select value={inviteForm.role} onChange={(e) => { setInviteForm((f) => ({ ...f, role: e.target.value as InviteCompanyMemberInput["role"] })); setSelectedStudentId(""); }}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold focus:outline-none focus:border-primary/50">
                  <option value="student">{t("studentsPage.roles.student")}</option>
                  <option value="parent">{t("studentsPage.roles.parent")}</option>
                </select>
              </InviteField>
              {isParentInvite && (
                <InviteField label={t("studentsPage.invite.linkedStudent")}>
                  <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold focus:outline-none focus:border-primary/50">
                    <option value="">{t("studentsPage.invite.linkedStudentPlaceholder")}</option>
                    {studentMembers.map((s) => (
                      <option key={s.userId} value={s.userId}>{s.fullName ?? s.email ?? `#${s.userId}`}</option>
                    ))}
                  </select>
                </InviteField>
              )}
            </div>
            <button onClick={handleInvite} disabled={inviteMutation.isPending || createGuardianMutation.isPending || !canSubmitInvite}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
              {inviteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" strokeWidth={2.5} />}
              {t("studentsPage.invite.send")}
            </button>
          </div>
        </div>
      )}

      {inviteSetupLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setInviteSetupLink(null)}>
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl chunky-shadow p-6 m-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg">{t("studentsPage.setupLink.title")}</p>
              <button onClick={() => setInviteSetupLink(null)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="size-5" strokeWidth={2.5} /></button>
            </div>
            <p className="text-sm text-foreground/70">{t("studentsPage.setupLink.hint")}</p>
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-muted px-3 py-2">
              <span className="flex-1 text-xs font-mono truncate text-foreground/70">{inviteSetupLink}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteSetupLink); toast.success(t("studentsPage.setupLink.copied")); }}
                className="shrink-0 flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-primary text-primary-foreground border border-foreground"
              >
                <Copy className="size-3" strokeWidth={2.5} /> {t("studentsPage.setupLink.copy")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function LearnersGrid({ members, locale }: { members: CompanyMemberRecord[]; locale: string }) {
  if (!members.length) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((m) => <LearnerCard key={m.id} member={m} locale={locale} />)}
    </div>
  );
}

function LearnerCard({ member: m, locale }: { member: CompanyMemberRecord; locale: string }) {
  const { t } = useTranslation();
  const isParent = m.role === "parent";
  return (
    <Link to="/students/$studentId" params={{ studentId: String(m.userId) }}
      className="group relative bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-primary/40 transition-all flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`size-11 rounded-xl border-2 border-foreground/10 grid place-items-center text-white font-black text-sm shrink-0 ${avatarColor(m.userId)}`}>
          {initials(m.fullName, m.email)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">{m.fullName ?? m.email ?? t("studentsPage.fallbackUser", { id: m.userId })}</p>
          <p className="text-[11px] text-foreground/50 font-medium truncate">{m.email}</p>
        </div>
        <ChevronRight className="size-4 text-foreground/30 group-hover:text-primary shrink-0 transition-colors mt-0.5" strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <RoleBadge role={m.role as "student" | "parent"} />
        {m.status === "suspended" && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
            {t("studentsPage.status.suspended")}
          </span>
        )}
        {isParent && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-lg">
            <Shield className="size-3" strokeWidth={2.5} /> {t("studentsPage.guardian")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] font-bold text-foreground/50 border-t-2 border-dashed border-border pt-3">
        {isParent
          ? <span className="flex items-center gap-1"><Users className="size-3" strokeWidth={2.5} /> {t("studentsPage.roles.parent")}</span>
          : <span className="flex items-center gap-1"><GraduationCap className="size-3" strokeWidth={2.5} /> {t("studentsPage.roles.student")}</span>
        }
        <span className="ml-auto">{t("studentsPage.joined", { date: m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString(locale, { month: "short", year: "numeric" }) : "—" })}</span>
      </div>
    </Link>
  );
}

function LearnersList({ members, locale }: { members: CompanyMemberRecord[]; locale: string }) {
  const { t } = useTranslation();
  if (!members.length) return <EmptyState />;
  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border text-[11px] font-black uppercase tracking-wider text-foreground/40">
            <th className="text-left px-4 py-3">{t("studentsPage.table.member")}</th>
            <th className="text-left px-4 py-3">{t("studentsPage.table.role")}</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">{t("studentsPage.table.joined")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-muted/40 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg border border-foreground/10 grid place-items-center text-white font-black text-xs shrink-0 ${avatarColor(m.userId)}`}>
                    {initials(m.fullName, m.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{m.fullName ?? t("studentsPage.fallbackUser", { id: m.userId })}</p>
                    <p className="text-[11px] text-foreground/50 truncate">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <RoleBadge role={m.role as "student" | "parent"} />
                  {m.status === "suspended" && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                      {t("studentsPage.status.suspended")}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-foreground/50 text-xs font-medium">
                {m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString(locale) : "—"}
              </td>
              <td className="px-4 py-3">
                <Link to="/students/$studentId" params={{ studentId: String(m.userId) }}
                  className="flex items-center gap-1 text-xs font-bold text-foreground/40 group-hover:text-primary transition-colors">
                  {t("studentsPage.actions.view")} <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }: { role: "student" | "parent" }) {
  const { t } = useTranslation();
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${ROLE_COLORS[role]}`}>
      {t(`studentsPage.roles.${role}`)}
    </span>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-10 grid place-items-center text-center">
      <GraduationCap className="size-10 text-foreground/20 mb-3" strokeWidth={1.5} />
      <p className="font-black text-base">{t("studentsPage.empty.title")}</p>
      <p className="text-sm text-foreground/50 font-medium">{t("studentsPage.empty.body")}</p>
    </div>
  );
}

function InviteField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
