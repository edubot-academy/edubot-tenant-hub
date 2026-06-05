import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, MessageSquare, BarChart3, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlaceholderDashboard } from "@/components/dashboard/PlaceholderDashboard";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "QuestLMS — Assistant" }] }),
  component: AssistantDashboard,
});

function AssistantDashboard() {
  return (
    <DashboardShell>
      <PlaceholderDashboard
        roleKey="assistant"
        surfaceOps
        cards={[
          { titleKey: "assistantCards.gradingTitle", descKey: "assistantCards.gradingDesc", icon: ClipboardCheck },
          { titleKey: "assistantCards.discussionsTitle", descKey: "assistantCards.discussionsDesc", icon: MessageSquare },
          { titleKey: "assistantCards.studentsTitle", descKey: "assistantCards.studentsDesc", icon: Users },
          { titleKey: "assistantCards.analyticsTitle", descKey: "assistantCards.analyticsDesc", icon: BarChart3 },
        ]}
      />
    </DashboardShell>
  );
}
