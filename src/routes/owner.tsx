import { createFileRoute } from "@tanstack/react-router";
import { Building2, CreditCard, BarChart3, Shield, Settings, Activity } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlaceholderDashboard } from "@/components/dashboard/PlaceholderDashboard";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "QuestLMS — Owner HQ" }] }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  return (
    <DashboardShell>
      <PlaceholderDashboard
        roleKey="owner"
        surfaceOps
        cards={[
          { titleKey: "ownerCards.tenantsTitle", descKey: "ownerCards.tenantsDesc", icon: Building2 },
          { titleKey: "ownerCards.billingTitle", descKey: "ownerCards.billingDesc", icon: CreditCard },
          { titleKey: "ownerCards.analyticsTitle", descKey: "ownerCards.analyticsDesc", icon: BarChart3 },
          { titleKey: "ownerCards.healthTitle", descKey: "ownerCards.healthDesc", icon: Activity },
          { titleKey: "ownerCards.auditTitle", descKey: "ownerCards.auditDesc", icon: Shield },
          { titleKey: "ownerCards.settingsTitle", descKey: "ownerCards.settingsDesc", icon: Settings },
        ]}
      />
    </DashboardShell>
  );
}
