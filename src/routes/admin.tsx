import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { UsersTable } from "@/components/admin/UsersTable";
import { ReportsCharts } from "@/components/admin/ReportsCharts";
import { CourseCatalog } from "@/components/admin/CourseCatalog";
import { IntegrationHub } from "@/components/admin/IntegrationHub";
import { AuditLog } from "@/components/admin/AuditLog";
import { BrandingPanel } from "@/components/admin/BrandingPanel";
import { BillingUsage } from "@/components/admin/BillingUsage";
import { ApiKeysPanel } from "@/components/admin/ApiKeysPanel";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "QuestLMS — Company Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell>
      <TopBar />
      <Link
        to="/admin/hierarchy"
        className="flex items-center justify-between gap-4 bg-card border-2 border-border rounded-2xl p-4 chunky-shadow hover:border-foreground/20 transition-colors mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="font-black text-base">Content Hierarchy</p>
            <p className="text-xs text-foreground/60">Toggle Courses and Modules for your tenant.</p>
          </div>
        </div>
        <span className="text-xs font-black text-primary">Configure →</span>
      </Link>
      <section className="grid grid-cols-12 gap-4">
        <ReportsCharts />
        <BrandingPanel />
        <BillingUsage />
        <UsersTable />
        <CourseCatalog />
        <ApiKeysPanel />
        <IntegrationHub />
        <AuditLog />
      </section>
    </DashboardShell>
  );
}

