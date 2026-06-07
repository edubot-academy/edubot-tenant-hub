import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/instructor/messages")({
  head: () => ({ meta: [{ title: "QuestLMS — Messages" }] }),
  component: InstructorMessages,
});

function InstructorMessages() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Messages" subtitle="Chat with students and parents" />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses demo direct-message threads.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><MessageSquare className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Instructor direct messaging is not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Backend mode currently has support-request flows and guardian-linked parent summaries, but it does not have a persistent instructor messaging contract for tenant hub.
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
              <p>Instructor thread list with student and guardian participants</p>
              <p>Message send and read state</p>
              <p>Attachment handling and notification hooks</p>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
