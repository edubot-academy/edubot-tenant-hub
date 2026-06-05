import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { AnalyticsSnapshot } from "@/components/assistant/AnalyticsSnapshot";
import { TrendingUp, Clock, CheckCircle2, Target } from "lucide-react";

export const Route = createFileRoute("/assistant/reports")({
  head: () => ({ meta: [{ title: "QuestLMS — Reports" }] }),
  component: AssistantReportsPage,
});

const kpis = [
  { label: "Graded this week", value: "142", icon: CheckCircle2, color: "text-success" },
  { label: "Avg response time", value: "3.4h", icon: Clock, color: "text-primary" },
  { label: "SLA compliance", value: "97%", icon: Target, color: "text-accent-foreground" },
  { label: "Grading velocity", value: "+12%", icon: TrendingUp, color: "text-secondary" },
];

function AssistantReportsPage() {
  return (
    <DashboardShell>
      <TopBar title="Reports" subtitle="Your operational metrics at a glance." showStreak={false} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <k.icon className={`size-5 ${k.color}`} strokeWidth={2.5} />
            <p className="text-3xl font-black font-mono mt-3">{k.value}</p>
            <p className="text-xs text-foreground/55 font-medium mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-12 gap-4">
        <AnalyticsSnapshot />
      </section>
    </DashboardShell>
  );
}
