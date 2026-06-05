import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { TenantOverview } from "@/components/owner/TenantOverview";
import { RevenueMetrics } from "@/components/owner/RevenueMetrics";
import { SystemHealth } from "@/components/owner/SystemHealth";
import { GlobalAnalytics } from "@/components/owner/GlobalAnalytics";
import { SecurityCenter } from "@/components/owner/SecurityCenter";
import { PlatformSettings } from "@/components/owner/PlatformSettings";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "QuestLMS — Owner HQ" }] }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        <TenantOverview />
        <RevenueMetrics />
        <SystemHealth />
        <GlobalAnalytics />
        <SecurityCenter />
        <PlatformSettings />
      </section>
    </DashboardShell>
  );
}
