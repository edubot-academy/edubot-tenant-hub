import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Info, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "QuestLMS — Discover Courses" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Discover" subtitle="Find your next adventure" />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses a demo course discovery catalog.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><Sparkles className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Student discovery catalog is not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Tenant hub does not yet have a backend learner-facing course discovery contract. Backend mode should not show seeded marketplace-style courses here until discover or recommendation APIs exist.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-center gap-2 text-foreground/55">
              <Info className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Needed backend scope</span>
            </div>
            <div className="mt-4 space-y-3">
              <Requirement icon={<Search className="size-4" />} title="Searchable catalog" detail="Discoverable learner-safe course list scoped for tenant or public catalog visibility." />
              <Requirement icon={<BookOpen className="size-4" />} title="Recommendation rules" detail="Suggested courses or subjects based on learner progress, class assignments, or enrollment state." />
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function Requirement({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-foreground/70">
        {icon}
        <span className="text-sm font-black">{title}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground/60">{detail}</p>
    </div>
  );
}
