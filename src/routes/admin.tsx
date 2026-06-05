import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { UsersTable } from "@/components/admin/UsersTable";
import { ReportsCharts } from "@/components/admin/ReportsCharts";
import { CourseCatalog } from "@/components/admin/CourseCatalog";
import { IntegrationHub } from "@/components/admin/IntegrationHub";
import { AuditLog } from "@/components/admin/AuditLog";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "QuestLMS — Company Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        <ReportsCharts />
        <UsersTable />
        <CourseCatalog />
        <IntegrationHub />
        <AuditLog />
      </section>
    </DashboardShell>
  );
}
