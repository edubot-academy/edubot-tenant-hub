import { createFileRoute } from "@tanstack/react-router";
import i18n from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { LaunchQuizHero } from "@/components/dashboard/LaunchQuizHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveClasses } from "@/components/dashboard/ActiveClasses";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { TodaySessions } from "@/components/dashboard/TodaySessions";
import { AttentionCards } from "@/components/dashboard/AttentionCards";
import { useRole } from "@/lib/roles";
import { StudentDashboard } from "./student";
import { ParentDashboard } from "./parent";
import { AssistantDashboard } from "./assistant";
import { CompanyAdminDashboard } from "./company-admin";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: i18n.t("overview.meta.title") },
      { name: "description", content: i18n.t("overview.meta.description") },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { role } = useRole();
  if (role === "student") return <StudentDashboard />;
  if (role === "parent") return <ParentDashboard />;
  if (role === "assistant") return <AssistantDashboard />;
  if (role === "company_admin" || role === "owner") return <CompanyAdminDashboard />;
  return <InstructorDashboard />;
}

function InstructorDashboard() {
  return (
    <DashboardShell>
      <TopBar />

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8">
        <LaunchQuizHero />
        <QuickActions />
      </section>

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8">
        <SetupChecklist />
      </section>

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8">
        <TodaySessions />
      </section>

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8">
        <AttentionCards />
      </section>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <ActiveClasses />
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <Leaderboard />
        </section>
      </div>
    </DashboardShell>
  );
}
