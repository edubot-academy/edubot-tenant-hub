import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { GradingQueueBoard } from "@/components/assistant/GradingQueueBoard";

export const Route = createFileRoute("/assistant/grading")({
  head: () => ({ meta: [{ title: "QuestLMS — Grading Queue" }] }),
  component: AssistantGradingPage,
});

function AssistantGradingPage() {
  return (
    <DashboardShell>
      <TopBar title="Grading Queue" subtitle="Submissions waiting for your review." showStreak={false} />
      <section className="grid grid-cols-12 gap-4">
        <GradingQueueBoard />
      </section>
    </DashboardShell>
  );
}
