import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { StaffInviteForm, type StaffRole } from "@/components/admin/StaffInviteForm";
import { PendingInvites, type Invite } from "@/components/admin/PendingInvites";
import { StaffMembers, type StaffMember } from "@/components/admin/StaffMembers";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import {
  type CompanyMemberRecord,
  useCompanyStaff,
  useInviteCompanyMember,
  useRemoveCompanyMember,
  useResendCompanyInvitation,
  useSetCompanyMemberRole,
} from "@/lib/company-admin/staff-api";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/company-admin/staff")({
  head: () => ({ meta: [{ title: "QuestLMS — Staff & Invites" }] }),
  component: StaffPage,
});

const INITIAL_MEMBERS: StaffMember[] = [
  { id: "1", name: "Aris Bekov", email: "aris@quest.kg", role: "instructor", active: true, joined: "2024-01-12" },
  { id: "2", name: "Saltanat T.", email: "salta@quest.kg", role: "instructor", active: true, joined: "2024-02-03" },
  { id: "3", name: "Marat K.", email: "marat@quest.kg", role: "assistant", active: true, joined: "2024-03-19" },
  { id: "4", name: "Nurlan A.", email: "nurlan@quest.kg", role: "company_admin", active: true, joined: "2024-04-08" },
  { id: "5", name: "Begaim O.", email: "begaim@quest.kg", role: "assistant", active: false, joined: "2024-05-21" },
];

const INITIAL_INVITES: Invite[] = [
  { id: "i1", email: "kuban@quest.kg", role: "instructor", sentAt: "2 days ago" },
  { id: "i2", email: "aliya@quest.kg", role: "assistant", sentAt: "5 hours ago" },
];

type ManageableCompanyMemberRecord = CompanyMemberRecord & { role: StaffRole };

function isManageableMember(record: CompanyMemberRecord): record is ManageableCompanyMemberRecord {
  return record.role === "company_admin" || record.role === "assistant" || record.role === "instructor";
}

function sentAtLabel(value: string | null, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
}

function StaffPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const [members, setMembers] = useState<StaffMember[]>(INITIAL_MEMBERS);
  const [invites, setInvites] = useState<Invite[]>(INITIAL_INVITES);
  const { data, isLoading, isError } = useCompanyStaff();
  const inviteMember = useInviteCompanyMember();
  const resendInvitation = useResendCompanyInvitation();
  const removeMember = useRemoveCompanyMember();
  const setMemberRole = useSetCompanyMemberRole();

  const membersById = useMemo(() => {
    const map = new Map<string, ManageableCompanyMemberRecord>();
    for (const record of data ?? []) {
      if (isManageableMember(record)) {
        map.set(`${record.userId}:${record.role}`, record);
      }
    }
    return map;
  }, [data]);

  const backendMembers = useMemo<StaffMember[]>(() => {
    return (data ?? [])
      .filter(isManageableMember)
      .map((record) => ({
        id: `${record.userId}:${record.role}`,
        name: record.fullName ?? record.email ?? `User ${record.userId}`,
        email: record.email ?? "",
        role: record.role,
        active: record.status === "active",
        joined: record.createdAt ? record.createdAt.slice(0, 10) : "",
      }));
  }, [data]);

  const backendInvites = useMemo<Invite[]>(() => {
    return (data ?? [])
      .filter(isManageableMember)
      .filter((record) => record.status === "invited" || record.invitation?.status === "pending")
      .map((record) => ({
        id: `${record.userId}:${record.role}`,
        email: record.email ?? "",
        role: record.role,
        sentAt: sentAtLabel(record.invitation?.sentAt ?? record.invitedAt, t("staff.pending.justNow")),
      }));
  }, [data, t]);

  const handleInvite = async (input: { fullName: string; email: string; role: StaffRole }) => {
    if (backendEnabled) {
      try {
        await inviteMember.mutateAsync({ ...input, sendEmail: true });
        toast.success(t("staff.toast.invited"));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : t("staff.toast.inviteFailed"));
      }
      return;
    }

    setInvites((prev) => [
      { id: `i${Date.now()}`, email: input.email, role: input.role, sentAt: t("staff.pending.justNow") },
      ...prev,
    ]);
  };

  const handleResend = async (id: string) => {
    if (backendEnabled) {
      const record = membersById.get(id);
      if (!record) return;
      try {
        await resendInvitation.mutateAsync({ userId: record.userId, sendEmail: true });
        toast.success(t("staff.toast.resent"));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : t("staff.toast.resendFailed"));
      }
      return;
    }

    setInvites((prev) =>
      prev.map((invite) => (invite.id === id ? { ...invite, sentAt: t("staff.pending.justNow") } : invite)),
    );
  };

  const handleRevoke = async (id: string) => {
    if (backendEnabled) {
      const record = membersById.get(id);
      if (!record) return;
      try {
        await removeMember.mutateAsync({ userId: record.userId, role: record.role });
        toast.success(t("staff.toast.revoked"));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : t("staff.toast.revokeFailed"));
      }
      return;
    }

    setInvites((prev) => prev.filter((invite) => invite.id !== id));
  };

  const handleRoleChange = async (id: string, role: StaffRole) => {
    if (backendEnabled) {
      const record = membersById.get(id);
      if (!record) return;
      try {
        await setMemberRole.mutateAsync({ userId: record.userId, role, fromRole: record.role });
        toast.success(t("staff.toast.roleUpdated"));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : t("staff.toast.roleUpdateFailed"));
      }
      return;
    }

    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
  };

  const handleToggleActive = async (id: string) => {
    if (backendEnabled) {
      const record = membersById.get(id);
      if (!record || !record.email) return;
      try {
        if (record.status === "suspended") {
          await inviteMember.mutateAsync({
            fullName: record.fullName ?? record.email,
            email: record.email,
            role: record.role,
            sendEmail: true,
          });
          toast.success(t("staff.toast.reactivated"));
        } else {
          await removeMember.mutateAsync({ userId: record.userId, role: record.role });
          toast.success(t("staff.toast.removed"));
        }
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : t("staff.toast.memberUpdateFailed"));
      }
      return;
    }

    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, active: !member.active } : member)));
  };

  const visibleMembers = backendEnabled ? backendMembers : members;
  const visibleInvites = backendEnabled ? backendInvites : invites;
  const isMutating =
    inviteMember.isPending ||
    resendInvitation.isPending ||
    removeMember.isPending ||
    setMemberRole.isPending;

  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        {backendEnabled && isLoading && (
          <div className="col-span-12 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
            {t("staff.state.loading")}
          </div>
        )}
        {backendEnabled && isError && (
          <div className="col-span-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {t("staff.state.error")}
          </div>
        )}
        <StaffInviteForm onInvite={handleInvite} disabled={isMutating} />
        <PendingInvites invites={visibleInvites} onResend={handleResend} onRevoke={handleRevoke} />
        <StaffMembers
          members={visibleMembers}
          onRoleChange={handleRoleChange}
          onToggleActive={handleToggleActive}
        />
      </section>
    </DashboardShell>
  );
}
