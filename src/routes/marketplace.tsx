import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Store } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "QuestLMS — Marketplace" }] }),
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <DashboardShell>
      <TopBar title="Marketplace" subtitle="Shared content from instructors and partners around the world." showStreak={false} />
      <section className="rounded-3xl border-2 border-border bg-card p-10 text-center space-y-3">
        <Store className="mx-auto size-10 text-foreground/30" />
        <p className="font-black text-base">Marketplace coming soon</p>
        <p className="text-sm font-medium text-foreground/55">
          Browse and acquire ready-made quiz packs from instructors and content partners.
        </p>
      </section>
    </DashboardShell>
  );
}
