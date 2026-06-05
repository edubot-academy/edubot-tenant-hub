import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <TopBar />

        <section className="grid grid-cols-12 gap-6 mb-12">
          <LaunchQuizHero />
          <QuickActions />
        </section>

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
