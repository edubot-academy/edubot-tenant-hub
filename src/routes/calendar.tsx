import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChevronLeft, ChevronRight, Plus, Video, FileText, Calendar as CalIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "QuestLMS — Calendar" }] }),
  component: CalendarPage,
});

type EventKind = "session" | "deadline" | "event";
type Event = { id: string; day: number; time: string; title: string; kind: EventKind };

const events: Event[] = [
  { id: "e1", day: 3, time: "09:00", title: "Cognitive Psych Live", kind: "session" },
  { id: "e2", day: 3, time: "14:00", title: "Essay 4 due", kind: "deadline" },
  { id: "e3", day: 5, time: "10:30", title: "Lab session: Chemistry II", kind: "session" },
  { id: "e4", day: 8, time: "—", title: "Open day", kind: "event" },
  { id: "e5", day: 12, time: "13:00", title: "History quiz", kind: "deadline" },
  { id: "e6", day: 15, time: "09:00", title: "Parent meeting", kind: "event" },
  { id: "e7", day: 18, time: "11:00", title: "Working Memory recap", kind: "session" },
  { id: "e8", day: 21, time: "—", title: "Project milestone", kind: "deadline" },
];

const kindStyle: Record<EventKind, string> = {
  session: "bg-primary/15 border-primary/40 text-primary",
  deadline: "bg-destructive/15 border-destructive/40 text-destructive",
  event: "bg-secondary/20 border-secondary/40 text-secondary-foreground",
};

const kindIcon: Record<EventKind, typeof Video> = {
  session: Video,
  deadline: FileText,
  event: CalIcon,
};

function CalendarPage() {
  const [month, setMonth] = useState("June 2026");
  // Build 6×7 grid; June 2026 starts on a Monday (day 1 at index 0)
  const days: (number | null)[] = [];
  for (let i = 0; i < 0; i++) days.push(null);
  for (let d = 1; d <= 30; d++) days.push(d);
  while (days.length < 42) days.push(null);

  const todays = events.filter((e) => e.day === 5);

  return (
    <DashboardShell>
      <TopBar title="Calendar" subtitle="Sessions, deadlines, events — all in one place" />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth("May 2026")} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow"><ChevronLeft className="size-4" /></button>
          <h2 className="text-2xl font-black px-3">{month}</h2>
          <button onClick={() => setMonth("July 2026")} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow"><ChevronRight className="size-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-card border-2 border-border rounded-xl p-1 chunky-shadow">
            {["Month", "Week", "Day", "Agenda"].map((v, i) => (
              <button key={v} className={`px-3 py-1.5 rounded-lg font-bold text-xs ${i === 0 ? "bg-foreground text-background" : "text-foreground/60"}`}>{v}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <Plus className="size-4" strokeWidth={3} /> Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <section className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-black uppercase tracking-wider text-foreground/50 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const dayEvents = d ? events.filter((e) => e.day === d) : [];
              const isToday = d === 5;
              return (
                <div key={i} className={`min-h-[88px] p-1.5 rounded-xl border-2 ${isToday ? "border-primary bg-primary/5" : "border-border bg-background/50"} ${!d ? "opacity-30" : ""}`}>
                  <div className="text-xs font-black mb-1">{d}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${kindStyle[e.kind]} truncate`}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] font-bold text-foreground/50">+{dayEvents.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/50">Today · Jun 5</p>
            <h3 className="font-black text-xl mt-1 mb-3">{todays.length} items</h3>
            <ul className="space-y-2">
              {todays.map((e) => {
                const Icon = kindIcon[e.kind];
                return (
                  <li key={e.id} className={`p-3 rounded-xl border-2 ${kindStyle[e.kind]} flex items-start gap-2`}>
                    <Icon className="size-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm">{e.title}</p>
                      <p className="text-xs font-mono font-bold opacity-70">{e.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3">Calendars</h3>
            <ul className="space-y-2">
              {[
                { label: "Live sessions", color: "bg-primary" },
                { label: "Deadlines", color: "bg-destructive" },
                { label: "Events", color: "bg-secondary" },
                { label: "Personal", color: "bg-accent" },
              ].map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" defaultChecked className="accent-current" />
                  <span className={`size-3 rounded-full ${c.color}`} />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
