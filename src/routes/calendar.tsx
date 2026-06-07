import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Info, Video } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "QuestLMS — Calendar" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Calendar" subtitle="Sessions, deadlines, and events." />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          Prototype mode uses a local calendar board.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><CalendarDays className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Unified calendar is not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Tenant hub has real session and schedule data in several role-specific screens, but it does not yet have a backend contract for one merged calendar feed across sessions, deadlines, and tenant events.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/70">
              Keep using role-specific schedule surfaces for now:
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>students: class and course schedules</li>
                <li>parents: linked-child schedule</li>
                <li>academic classes: timetable inside class detail</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-center gap-2 text-foreground/55">
              <Info className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Needed backend scope</span>
            </div>
            <div className="mt-4 space-y-3">
              <Requirement icon={<Video className="size-4" />} title="Session feed" detail="One normalized stream across course-center sessions and academic sessions." />
              <Requirement icon={<CalendarDays className="size-4" />} title="Deadline feed" detail="Homework, activities, quizzes, and assignment due dates in one contract." />
              <Requirement icon={<Info className="size-4" />} title="Tenant events" detail="Announcements or institutional events that are not session rows." />
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
