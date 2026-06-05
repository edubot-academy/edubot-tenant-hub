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
import { PendingGrading } from "@/components/dashboard/PendingGrading";
import { AtRiskStudents } from "@/components/dashboard/AtRiskStudents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Edubot — Instructor Dashboard" },
      {
        name: "description",
        content:
          "Gamified instructor dashboard for Edubot — sessions, grading, student insights, and live quiz battles.",
      },
      { property: "og:title", content: "Edubot — Instructor Dashboard" },
      {
        property: "og:description",
        content:
          "Gamified instructor dashboard for Edubot — sessions, grading, student insights, and live quiz battles.",
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

        <InsightsRow />

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

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 lg:col-span-8">
            <PendingGrading />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <AtRiskStudents />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <ActiveClasses />
          <section className="col-span-12 lg:col-span-4 space-y-6">
            <Leaderboard />
            <MilestoneCard />
          </section>
        </div>
      </main>
    </div>
  );
}
