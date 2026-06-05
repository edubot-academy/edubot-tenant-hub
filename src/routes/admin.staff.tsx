import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { StaffInviteForm, type StaffRole } from "@/components/admin/StaffInviteForm";
import { PendingInvites, type Invite } from "@/components/admin/PendingInvites";
import { StaffMembers, type StaffMember } from "@/components/admin/StaffMembers";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({ meta: [{ title: "QuestLMS — Staff & Invites" }] }),
  component: StaffPage,
});

const INITIAL_MEMBERS: StaffMember[] = [
  { id: 1, name: "Aris Bekov", email: "aris@quest.kg", role: "instructor", active: true, joined: "2024-01-12" },
  { id: 2, name: "Saltanat T.", email: "salta@quest.kg", role: "instructor", active: true, joined: "2024-02-03" },
  { id: 3, name: "Marat K.", email: "marat@quest.kg", role: "assistant", active: true, joined: "2024-03-19" },
  { id: 4, name: "Nurlan A.", email: "nurlan@quest.kg", role: "company_admin", active: true, joined: "2024-04-08" },
  { id: 5, name: "Begaim O.", email: "begaim@quest.kg", role: "assistant", active: false, joined: "2024-05-21" },
];

const INITIAL_INVITES: Invite[] = [
  { id: "i1", email: "kuban@quest.kg", role: "instructor", sentAt: "2 days ago" },
  { id: "i2", email: "aliya@quest.kg", role: "assistant", sentAt: "5 hours ago" },
];

function StaffPage() {
  const [members, setMembers] = useState<StaffMember[]>(INITIAL_MEMBERS);
  const [invites, setInvites] = useState<Invite[]>(INITIAL_INVITES);

  const handleInvite = (email: string, role: StaffRole) => {
    setInvites((prev) => [
      { id: `i${Date.now()}`, email, role, sentAt: "just now" },
      ...prev,
    ]);
  };

  const handleResend = (id: string) => {
    setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, sentAt: "just now" } : i)));
  };

  const handleRevoke = (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRoleChange = (id: number, role: StaffRole) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const handleToggleActive = (id: number) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        <StaffInviteForm onInvite={handleInvite} />
        <PendingInvites invites={invites} onResend={handleResend} onRevoke={handleRevoke} />
        <StaffMembers
          members={members}
          onRoleChange={handleRoleChange}
          onToggleActive={handleToggleActive}
        />
      </section>
    </DashboardShell>
  );
}
