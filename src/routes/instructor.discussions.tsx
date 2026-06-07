import { createFileRoute } from "@tanstack/react-router";
import { Flag, MessageSquare } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/discussions")({
  head: () => ({ meta: [{ title: "QuestLMS — Discussions" }] }),
  component: DiscussionsPage,
});

function DiscussionsPage() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Discussions" subtitle="Answer questions and moderate class forums" />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo discussion threads.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><MessageSquare className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Instructor discussion threads are not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Tenant hub does not yet have a real instructor forum or class-thread contract. Backend mode should not show seeded thread data here until discussion endpoints exist.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-center gap-2 text-foreground/55">
              <Flag className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Needed backend scope</span>
            </div>
            <div className="mt-4 space-y-3 text-sm font-medium text-foreground/65">
              <p>Class or course discussion thread list</p>
              <p>Thread replies and moderation state</p>
              <p>Instructor actions for answer, pin, flag, and remove</p>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
