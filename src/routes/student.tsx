import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { TodayHero } from "@/components/student/TodayHero";
import { QuizArenaCard } from "@/components/student/QuizArenaCard";
import { MyTodo } from "@/components/student/MyTodo";
import { CourseProgress } from "@/components/student/CourseProgress";
import { StreakCalendar } from "@/components/student/StreakCalendar";
import { XpLeague } from "@/components/student/XpLeague";
import { AchievementsWall } from "@/components/student/AchievementsWall";
import { AiTutorCard } from "@/components/student/AiTutorCard";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "QuestLMS — Student" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { t } = useTranslation();
  return (
    <DashboardShell>
      <TopBar
        title={t("student.topbar.title", { name: "Maria" })}
        subtitle={t("student.topbar.subtitle")}
      />

      <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-8 lg:mb-10">
        <TodayHero />
        <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <XpLeague />
          <QuizArenaCard />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 mb-8 lg:mb-10">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <CourseProgress />
          <MyTodo />
          <AchievementsWall />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <StreakCalendar />
          <AiTutorCard />
        </div>
      </div>
    </DashboardShell>
  );
}
