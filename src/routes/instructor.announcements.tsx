import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Send } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/announcements")({
  head: () => ({ meta: [{ title: "QuestLMS — Announcements" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Announcements" subtitle="Broadcast updates to your classes" />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo class announcements.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><Megaphone className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Instructor announcements are not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Tenant hub does not yet have a backend announcement model for class-scoped broadcast posts. Backend mode should stay explicit here until that contract exists.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-center gap-2 text-foreground/55">
              <Send className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Needed backend scope</span>
            </div>
            <div className="mt-4 space-y-3 text-sm font-medium text-foreground/65">
              <p>Announcement create and list by class or course</p>
              <p>Read or acknowledgment tracking by learner</p>
              <p>Notification fan-out to enrolled students and guardians</p>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
