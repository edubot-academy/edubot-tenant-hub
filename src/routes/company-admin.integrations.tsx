import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { IntegrationsMarketplace } from "@/components/admin/IntegrationsMarketplace";

export const Route = createFileRoute("/company-admin/integrations")({
  head: () => ({ meta: [{ title: "QuestLMS — Integrations" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return (
    <DashboardShell>
      <TopBar />
      <IntegrationsMarketplace />
    </DashboardShell>
  );
}
