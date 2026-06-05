import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { LaunchQuizHero } from "@/components/dashboard/LaunchQuizHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveClasses } from "@/components/dashboard/ActiveClasses";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { MilestoneCard } from "@/components/dashboard/MilestoneCard";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { InsightsRow } from "@/components/dashboard/InsightsRow";
import { TodaySessions } from "@/components/dashboard/TodaySessions";
import { GradingQueue } from "@/components/dashboard/GradingQueue";
import { AtRiskStudents } from "@/components/dashboard/AtRiskStudents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduBot Learning — Instructor Dashboard" },
      {
        name: "description",
        content:
          "EduBot Learning instructor dashboard with live learning, student progress, XP, and engagement tools.",
      },
      { property: "og:title", content: "EduBot Learning — Instructor Dashboard" },
      {
        property: "og:description",
        content:
          "Instructor workspace for courses, live sessions, grading, and student support.",
      },
    ],
  }),
  component: InstructorDashboard,
});

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
        <InsightsRow />
      </section>

      <section className="grid grid-cols-12 gap-6 mb-8">
        <TodaySessions />
        <GradingQueue />
      </section>

      <section className="grid grid-cols-12 gap-6 mb-8">
        <AtRiskStudents />
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <MilestoneCard />
        </div>
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
