import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Trophy, Flame, Library, GraduationCap, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlaceholderDashboard } from "@/components/dashboard/PlaceholderDashboard";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "QuestLMS — Student" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  return (
    <DashboardShell>
      <PlaceholderDashboard
        roleKey="student"
        cards={[
          { titleKey: "studentCards.todayTitle", descKey: "studentCards.todayDesc", icon: Calendar },
          { titleKey: "studentCards.coursesTitle", descKey: "studentCards.coursesDesc", icon: BookOpen },
          { titleKey: "studentCards.quizArenaTitle", descKey: "studentCards.quizArenaDesc", icon: Library },
          { titleKey: "studentCards.streakTitle", descKey: "studentCards.streakDesc", icon: Flame },
          { titleKey: "studentCards.achievementsTitle", descKey: "studentCards.achievementsDesc", icon: Trophy },
          { titleKey: "studentCards.leaderboardTitle", descKey: "studentCards.leaderboardDesc", icon: GraduationCap },
        ]}
      />
    </DashboardShell>
  );
}
