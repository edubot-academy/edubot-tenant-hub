import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { LaunchQuizHero } from "@/components/dashboard/LaunchQuizHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveClasses } from "@/components/dashboard/ActiveClasses";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { MilestoneCard } from "@/components/dashboard/MilestoneCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuestLMS — Instructor Dashboard" },
      {
        name: "description",
        content:
          "Gamified academic LMS dashboard with streaks, XP, live quizzes, and student leaderboards.",
      },
      { property: "og:title", content: "QuestLMS — Instructor Dashboard" },
      {
        property: "og:description",
        content:
          "Gamified academic LMS dashboard with streaks, XP, live quizzes, and student leaderboards.",
      },
    ],
  }),
  component: InstructorDashboard,
});

function InstructorDashboard() {
  return (
    <DashboardShell>
      <TopBar />

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-10 lg:mb-12">
        <LaunchQuizHero />
        <QuickActions />
      </section>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <ActiveClasses />
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <Leaderboard />
          <MilestoneCard />
        </section>
      </div>
    </DashboardShell>
  );
}
