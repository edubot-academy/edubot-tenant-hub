import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ModerationQueue } from "@/components/assistant/ModerationQueue";
import { StudentTickets } from "@/components/assistant/StudentTickets";

export const Route = createFileRoute("/assistant/discussions")({
  head: () => ({ meta: [{ title: "QuestLMS — Discussions" }] }),
  component: AssistantDiscussionsPage,
});

function AssistantDiscussionsPage() {
  return (
    <DashboardShell>
      <TopBar title="Discussions & Tickets" subtitle="Moderate threads and respond to student requests." showStreak={false} />
      <section className="grid grid-cols-12 gap-4">
        <ModerationQueue />
        <StudentTickets />
      </section>
    </DashboardShell>
  );
}
