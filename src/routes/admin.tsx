import { createFileRoute } from "@tanstack/react-router";
import { Users, BookOpen, BarChart3, Plug, Settings, Shield } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlaceholderDashboard } from "@/components/dashboard/PlaceholderDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "QuestLMS — Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell>
      <PlaceholderDashboard
        roleKey="company_admin"
        surfaceOps
        cards={[
          { titleKey: "adminCards.usersTitle", descKey: "adminCards.usersDesc", icon: Users },
          { titleKey: "adminCards.coursesTitle", descKey: "adminCards.coursesDesc", icon: BookOpen },
          { titleKey: "adminCards.reportsTitle", descKey: "adminCards.reportsDesc", icon: BarChart3 },
          { titleKey: "adminCards.integrationsTitle", descKey: "adminCards.integrationsDesc", icon: Plug },
          { titleKey: "adminCards.auditTitle", descKey: "adminCards.auditDesc", icon: Shield },
          { titleKey: "adminCards.settingsTitle", descKey: "adminCards.settingsDesc", icon: Settings },
        ]}
      />
    </DashboardShell>
  );
}
