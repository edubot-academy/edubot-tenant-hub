import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { LaunchQuizHero } from "@/components/dashboard/LaunchQuizHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveClasses } from "@/components/dashboard/ActiveClasses";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { MilestoneCard } from "@/components/dashboard/MilestoneCard";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { InsightsRow } from "@/components/dashboard/InsightsRow";
import { TodaySessions } from "@/components/dashboard/TodaySessions";
import { AtRiskStudents } from "@/components/dashboard/AtRiskStudents";
import { AttentionQueue } from "@/components/dashboard/AttentionQueue";
import { HomeworkQueue } from "@/components/dashboard/HomeworkQueue";
import { CertificatesPanel } from "@/components/dashboard/CertificatesPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingSessionsPanel } from "@/components/dashboard/UpcomingSessionsPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Edubot — Instructor Dashboard" },
      {
        name: "description",
        content:
          "Gamified instructor dashboard for Edubot — sessions, grading, certificates, activity, and live quiz battles.",
      },
      { property: "og:title", content: "Edubot — Instructor Dashboard" },
      {
        property: "og:description",
        content:
          "Gamified instructor dashboard for Edubot — sessions, grading, certificates, activity, and live quiz battles.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <TopBar />

        {/* Admin command center: KPIs + attention queue */}
        <InsightsRow />
        <div className="mb-8">
          <AttentionQueue />
        </div>

        {/* Today operations + primary launch */}
        <section className="grid grid-cols-12 gap-6 mb-8">
          <LaunchQuizHero />
          <QuickActions />
        </section>

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 lg:col-span-8">
            <TodaySessions />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <SetupChecklist />
          </div>
        </div>

        {/* Homework + certificates + upcoming */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 lg:col-span-8">
            <HomeworkQueue />
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <CertificatesPanel />
            <UpcomingSessionsPanel />
          </div>
        </div>

        {/* Classes + leaderboard / milestones */}
        <div className="grid grid-cols-12 gap-8 mb-8">
          <ActiveClasses />
          <section className="col-span-12 lg:col-span-4 space-y-6">
            <Leaderboard />
            <MilestoneCard />
          </section>
        </div>

        {/* Activity + at-risk students */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <ActivityFeed />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <AtRiskStudents />
          </div>
        </div>
      </main>
    </div>
  );
}
