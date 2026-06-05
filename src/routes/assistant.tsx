import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { GradingQueueBoard } from "@/components/assistant/GradingQueueBoard";
import { ModerationQueue } from "@/components/assistant/ModerationQueue";
import { StudentTickets } from "@/components/assistant/StudentTickets";
import { AnalyticsSnapshot } from "@/components/assistant/AnalyticsSnapshot";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "QuestLMS — Assistant" }] }),
  component: AssistantDashboard,
});

function AssistantDashboard() {
  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        <GradingQueueBoard />
        <ModerationQueue />
        <StudentTickets />
        <AnalyticsSnapshot />
      </section>
    </DashboardShell>
  );
}
