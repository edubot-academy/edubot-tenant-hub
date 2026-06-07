import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParentSchedule } from "@/lib/parent-portal-api";

export const Route = createFileRoute("/parent/schedule")({
  head: () => ({ meta: [{ title: "QuestLMS — Schedule" }] }),
  component: ParentSchedulePage,
});

function ParentSchedulePage() {
  const scheduleQuery = useParentSchedule();
  const items = scheduleQuery.data ?? [];
  const grouped = groupByDay(items);

  return (
    <DashboardShell>
      <TopBar title="Schedule" subtitle="Upcoming sessions across all linked children." showStreak={false} />

      {scheduleQuery.isLoading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((index) => <div key={index} className="h-40 rounded-3xl border-2 border-border bg-card animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <p className="font-black">No upcoming sessions</p>
          <p className="text-sm text-foreground/60 mt-2">Upcoming class sessions for linked children will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((day) => (
            <section key={day.day}>
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground/60 mb-3 flex items-center gap-2">
                <Calendar className="size-4" /> {day.day}
              </h3>
              <ul className="space-y-3">
                {day.items.map((item) => (
                  <li
                    key={`${item.studentId}-${item.sessionId}`}
                    className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow flex items-center gap-4"
                  >
                    <div className="text-center shrink-0 px-3 py-2 rounded-xl bg-primary/10 text-primary font-mono font-black">
                      {formatTime(item.startsAt ?? item.startAt ?? null)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black truncate">{item.sessionTitle}</p>
                      <p className="text-xs text-foreground/55 font-medium flex items-center gap-3 mt-0.5 flex-wrap">
                        <span>{item.studentName}</span>
                        <span>{item.courseTitle ?? item.groupName ?? "Session"}</span>
                        {item.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" /> {item.location}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-accent/20 shrink-0">
                      {item.liveProvider ? "Live" : item.location ? "In-person" : item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function groupByDay(items: ReturnType<typeof useParentSchedule>["data"] extends infer T ? Exclude<T, undefined> : never) {
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const label = formatDay(item.startsAt ?? item.startAt ?? null);
    const bucket = groups.get(label) ?? [];
    bucket.push(item);
    groups.set(label, bucket);
  }
  return Array.from(groups.entries()).map(([day, dayItems]) => ({ day, items: dayItems }));
}

function formatDay(value: string | null) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
