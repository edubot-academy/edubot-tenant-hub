import { createFileRoute } from "@tanstack/react-router";
import { Users, Calendar, MessageSquare, CreditCard, BookOpen, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlaceholderDashboard } from "@/components/dashboard/PlaceholderDashboard";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "QuestLMS — Parent" }] }),
  component: ParentDashboard,
});

function ParentDashboard() {
  return (
    <DashboardShell>
      <PlaceholderDashboard
        roleKey="parent"
        cards={[
          { titleKey: "parentCards.childrenTitle", descKey: "parentCards.childrenDesc", icon: Users },
          { titleKey: "parentCards.scheduleTitle", descKey: "parentCards.scheduleDesc", icon: Calendar },
          { titleKey: "parentCards.progressTitle", descKey: "parentCards.progressDesc", icon: BookOpen },
          { titleKey: "parentCards.milestonesTitle", descKey: "parentCards.milestonesDesc", icon: Trophy },
          { titleKey: "parentCards.messagesTitle", descKey: "parentCards.messagesDesc", icon: MessageSquare },
          { titleKey: "parentCards.billingTitle", descKey: "parentCards.billingDesc", icon: CreditCard },
        ]}
      />
    </DashboardShell>
  );
}
