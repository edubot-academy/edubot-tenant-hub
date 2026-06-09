import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Search, UserPlus, X, Mail, BookOpen, Users, LayoutGrid, List,
  Clock, ChevronRight, Send, Loader2,
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
  useRemoveCompanyMember,
  useResendCompanyInvitation,
  useSetCompanyMemberRole,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/company-admin/staff/")({
  head: () => ({ meta: [{ title: "QuestLMS — Members" }] }),
  component: StaffPage,
});

// ── helpers ──────────────────────────────────────────────────────────────────

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

const FILTER_TABS: { key: CompanyStaffRole | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "instructor", label: "Instructors" },
  { key: "assistant", label: "Assistants" },
  { key: "company_admin", label: "Admins" },
  { key: "student", label: "Students" },
  { key: "parent", label: "Parents" },
];

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? "?";
  return src.split(/[\s@.]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-teal-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

// ── prototype data ────────────────────────────────────────────────────────────

const PROTO_MEMBERS: CompanyMemberRecord[] = [
  { id: 1, userId: 101, companyId: 1, role: "instructor", status: "active", invitedByUserId: null, invitedAt: "2024-01-10T00:00:00Z", acceptedAt: "2024-01-11T00:00:00Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2024-01-11T00:00:00Z", fullName: "Aris Bekov", email: "aris@quest.kg", permissions: { canCreateCourses: true, canCreateGroups: false }, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 2, userId: 102, companyId: 1, role: "instructor", status: "active", invitedByUserId: null, invitedAt: "2024-02-01T00:00:00Z", acceptedAt: "2024-02-02T00:00:00Z", createdAt: "2024-02-01T00:00:00Z", updatedAt: "2024-02-02T00:00:00Z", fullName: "Saltanat T.", email: "salta@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 3, userId: 103, companyId: 1, role: "assistant", status: "active", invitedByUserId: null, invitedAt: "2024-03-15T00:00:00Z", acceptedAt: "2024-03-16T00:00:00Z", createdAt: "2024-03-15T00:00:00Z", updatedAt: "2024-03-16T00:00:00Z", fullName: "Marat K.", email: "marat@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 4, userId: 104, companyId: 1, role: "company_admin", status: "active", invitedByUserId: null, invitedAt: "2024-04-01T00:00:00Z", acceptedAt: "2024-04-02T00:00:00Z", createdAt: "2024-04-01T00:00:00Z", updatedAt: "2024-04-02T00:00:00Z", fullName: "Nurlan A.", email: "nurlan@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 5, userId: 105, companyId: 1, role: "student", status: "active", invitedByUserId: null, invitedAt: "2024-05-01T00:00:00Z", acceptedAt: "2024-05-01T00:00:00Z", createdAt: "2024-05-01T00:00:00Z", updatedAt: "2024-05-01T00:00:00Z", fullName: "Begaim O.", email: "begaim@quest.kg", permissions: null, invitation: null, onboarding: { status: "completed", setupRequired: false, setupCompleted: true, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
  { id: 6, userId: 106, companyId: 1, role: "instructor", status: "invited", invitedByUserId: null, invitedAt: "2024-06-01T00:00:00Z", acceptedAt: null, createdAt: "2024-06-01T00:00:00Z", updatedAt: "2024-06-01T00:00:00Z", fullName: null, email: "kuban@quest.kg", permissions: null, invitation: { status: "pending", setupLink: null, expiresAt: null, emailSent: true, sentAt: "2024-06-01T00:00:00Z" }, onboarding: { status: "not_started", setupRequired: true, setupCompleted: false, setupCompletedAt: null, setupLink: null, expiresAt: null, emailSent: null } },
];

// ── page ──────────────────────────────────────────────────────────────────────

function StaffPage() {
  const { context } = useAppContext();
  const isBackend = isBackendApiEnabled() && context.mode === "backend";

  const { data: backendData, isLoading } = useCompanyStaff();
  const inviteMutation = useInviteCompanyMember();
  const removeMutation = useRemoveCompanyMember();
  const resendMutation = useResendCompanyInvitation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _roleMutation = useSetCompanyMemberRole();

  const allMembers = isBackend ? (backendData ?? []) : PROTO_MEMBERS;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<CompanyStaffRole | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteCompanyMemberInput>({ fullName: "", email: "", role: "instructor", sendEmail: true });

  const active = allMembers.filter((m) => m.status === "active");
  const pending = allMembers.filter((m) => m.status === "invited");

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

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.fullName) return;
    if (isBackend) {
      try {
        await inviteMutation.mutateAsync(inviteForm);
        toast.success("Invitation sent!");
        setShowInvite(false);
        setInviteForm({ fullName: "", email: "", role: "instructor", sendEmail: true });
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Failed to invite member");
      }
    } else {
      toast.success("Invitation sent (prototype)");
      setShowInvite(false);
    }
  };

  const handleResend = async (m: CompanyMemberRecord) => {
    if (!isBackend) { toast.success("Resent (prototype)"); return; }
    try {
      await resendMutation.mutateAsync({ userId: m.userId });
      toast.success("Invitation resent");
    } catch { toast.error("Failed to resend"); }
  };

  const handleRevoke = async (m: CompanyMemberRecord) => {
    if (!isBackend) { toast.success("Revoked (prototype)"); return; }
    try {
      await removeMutation.mutateAsync({ userId: m.userId, role: m.role });
      toast.success("Invitation revoked");
    } catch { toast.error("Failed to revoke"); }
  };

  return (
    <DashboardShell>
      <TopBar title="Members" subtitle={`${active.length} active · ${pending.length} pending`} showStreak={false} />

      {/* ── top bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" strokeWidth={2.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-border bg-card text-sm font-medium focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl border-2 transition-colors ${viewMode === "grid" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
            <LayoutGrid className="size-4" strokeWidth={2.5} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl border-2 transition-colors ${viewMode === "list" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
            <List className="size-4" strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow text-sm font-black">
            <UserPlus className="size-4" strokeWidth={2.5} /> Invite
          </button>
        </div>
      </div>

      {/* ── role filter tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map(({ key, label }) => {
          const count = key === "all" ? active.length : (roleCounts[key] ?? 0);
          const isActive = roleFilter === key;
          return (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap border-2 transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/60"}`}
            >
              {label}
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/60"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── loading ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* ── members grid / list ── */}
      {!isLoading && (
        viewMode === "grid"
          ? <MembersGrid members={filtered} />
          : <MembersList members={filtered} />
      )}

      {/* ── pending invitations ── */}
      {pending.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-foreground/40 mb-3">Pending invitations ({pending.length})</p>
          <div className="space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-border bg-card">
                <div className="size-9 rounded-xl bg-muted border-2 border-border grid place-items-center">
                  <Mail className="size-4 text-foreground/40" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{m.email}</p>
                  <p className="text-[11px] text-foreground/50 font-medium flex items-center gap-1">
                    <Clock className="size-3" /> {m.invitedAt ? new Date(m.invitedAt).toLocaleDateString() : "Just now"} · <RoleBadge role={m.role} />
                  </p>
                </div>
                <button onClick={() => handleResend(m)} disabled={resendMutation.isPending} className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-border bg-muted hover:bg-muted/70 flex items-center gap-1.5">
                  <Send className="size-3" strokeWidth={2.5} /> Resend
                </button>
                <button onClick={() => handleRevoke(m)} disabled={removeMutation.isPending} className="p-1.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <X className="size-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── invite panel ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl chunky-shadow p-6 m-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-lg">Invite member</p>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="size-5" strokeWidth={2.5} /></button>
            </div>
            <div className="space-y-3">
              <InviteField label="Full name">
                <input value={inviteForm.fullName} onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Jane Smith" className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </InviteField>
              <InviteField label="Email">
                <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com" className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-medium focus:outline-none focus:border-primary/50" />
              </InviteField>
              <InviteField label="Role">
                <select value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as InviteCompanyMemberInput["role"] }))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold focus:outline-none focus:border-primary/50">
                  <option value="instructor">Instructor</option>
                  <option value="assistant">Assistant</option>
                  <option value="company_admin">Admin</option>
                </select>
              </InviteField>
            </div>
            <button onClick={handleInvite} disabled={inviteMutation.isPending || !inviteForm.email || !inviteForm.fullName}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
              {inviteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" strokeWidth={2.5} />}
              Send invitation
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// ── member card (grid) ────────────────────────────────────────────────────────

function MembersGrid({ members }: { members: CompanyMemberRecord[] }) {
  if (!members.length) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((m) => <MemberCard key={m.id} member={m} />)}
    </div>
  );
}

function MemberCard({ member: m }: { member: CompanyMemberRecord }) {
  return (
    <Link to="/company-admin/staff/$userId" params={{ userId: String(m.userId) }}
      className="group relative bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-primary/40 hover:shadow-primary/10 transition-all flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`size-11 rounded-xl border-2 border-foreground/10 grid place-items-center text-white font-black text-sm shrink-0 ${avatarColor(m.userId)}`}>
          {initials(m.fullName, m.email)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">{m.fullName ?? m.email ?? `User ${m.userId}`}</p>
          <p className="text-[11px] text-foreground/50 font-medium truncate">{m.email}</p>
        </div>
        <ChevronRight className="size-4 text-foreground/30 group-hover:text-primary shrink-0 transition-colors mt-0.5" strokeWidth={2.5} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <RoleBadge role={m.role} />
        <StatusDot status={m.status} />
        {m.role === "instructor" && m.permissions?.canCreateCourses && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">Can create</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] font-bold text-foreground/50 border-t-2 border-dashed border-border pt-3">
        <span className="flex items-center gap-1"><BookOpen className="size-3" strokeWidth={2.5} /> {ROLE_LABELS[m.role]}</span>
        <span className="ml-auto">Joined {m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString("en", { month: "short", year: "numeric" }) : "—"}</span>
      </div>
    </Link>
  );
}

// ── member row (list) ─────────────────────────────────────────────────────────

function MembersList({ members }: { members: CompanyMemberRecord[] }) {
  if (!members.length) return <EmptyState />;
  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden chunky-shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border text-[11px] font-black uppercase tracking-wider text-foreground/40">
            <th className="text-left px-4 py-3">Member</th>
            <th className="text-left px-4 py-3">Role</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Status</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
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
                    <p className="font-bold truncate">{m.fullName ?? `User ${m.userId}`}</p>
                    <p className="text-[11px] text-foreground/50 truncate">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><RoleBadge role={m.role} /></td>
              <td className="px-4 py-3 hidden sm:table-cell"><StatusDot status={m.status} /></td>
              <td className="px-4 py-3 hidden md:table-cell text-foreground/50 text-xs font-medium">
                {m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3">
                <Link to="/company-admin/staff/$userId" params={{ userId: String(m.userId) }}
                  className="flex items-center gap-1 text-xs font-bold text-foreground/40 group-hover:text-primary transition-colors">
                  View <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── shared sub-components ─────────────────────────────────────────────────────

function RoleBadge({ role }: { role: CompanyStaffRole }) {
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusDot({ status }: { status: "active" | "invited" | "suspended" }) {
  const cfg = {
    active: { dot: "bg-green-500", label: "Active" },
    invited: { dot: "bg-yellow-400", label: "Pending" },
    suspended: { dot: "bg-red-400", label: "Suspended" },
  }[status];
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/60">
      <span className={`size-2 rounded-full ${cfg.dot}`} /> {cfg.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-10 grid place-items-center text-center">
      <Users className="size-10 text-foreground/20 mb-3" strokeWidth={1.5} />
      <p className="font-black text-base">No members found</p>
      <p className="text-sm text-foreground/50 font-medium">Try a different filter or search term.</p>
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
