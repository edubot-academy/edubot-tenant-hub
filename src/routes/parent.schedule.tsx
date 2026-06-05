import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Calendar, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/parent/schedule")({
  head: () => ({ meta: [{ title: "QuestLMS — Schedule" }] }),
  component: ParentSchedulePage,
});

const days = [
  {
    day: "Today, Jun 5",
    items: [
      { time: "16:00", title: "Cognitive Psychology — Live", child: "Aizat", room: "Online · Zoom", tag: "Live" },
      { time: "18:30", title: "Math Tutoring", child: "Bekzat", room: "Room 204", tag: "In-person" },
    ],
  },
  {
    day: "Tomorrow, Jun 6",
    items: [
      { time: "10:00", title: "Organic Chemistry II — Lab", child: "Aizat", room: "Lab B", tag: "In-person" },
      { time: "14:00", title: "Parent-teacher meeting", child: "Bekzat", room: "Online · Meet", tag: "Meeting" },
    ],
  },
  {
    day: "Fri, Jun 7",
    items: [
      { time: "09:00", title: "World History — Modern Era", child: "Aizat", room: "Online · Zoom", tag: "Live" },
    ],
  },
];

function ParentSchedulePage() {
  return (
    <DashboardShell>
      <TopBar title="Schedule" subtitle="Upcoming sessions across all your children." showStreak={false} />

      <div className="space-y-8">
        {days.map((d) => (
          <section key={d.day}>
            <h3 className="font-black text-sm uppercase tracking-widest text-foreground/60 mb-3 flex items-center gap-2">
              <Calendar className="size-4" /> {d.day}
            </h3>
            <ul className="space-y-3">
              {d.items.map((it, i) => (
                <li
                  key={i}
                  className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow flex items-center gap-4"
                >
                  <div className="text-center shrink-0 px-3 py-2 rounded-xl bg-primary/10 text-primary font-mono font-black">
                    {it.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black truncate">{it.title}</p>
                    <p className="text-xs text-foreground/55 font-medium flex items-center gap-3 mt-0.5">
                      <span>{it.child}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {it.room}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-accent/20 shrink-0">
                    {it.tag}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
