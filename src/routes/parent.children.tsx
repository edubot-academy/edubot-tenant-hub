import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Flame, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/parent/children")({
  head: () => ({ meta: [{ title: "QuestLMS — Children" }] }),
  component: ParentChildrenPage,
});

const kids = [
  { id: "1", name: "Aizat", grade: "Grade 9", initials: "AI", streak: 12, avg: 87, courses: 4, attendance: 96 },
  { id: "2", name: "Bekzat", grade: "Grade 6", initials: "BE", streak: 5, avg: 73, courses: 3, attendance: 88 },
];

function ParentChildrenPage() {
  return (
    <DashboardShell>
      <TopBar title="Children" subtitle="All learners under your account." showStreak={false} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60 font-medium">{kids.length} children enrolled</p>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
          <Plus className="size-4" strokeWidth={3} /> Add child
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kids.map((k) => (
          <article key={k.id} className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-5">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-lg">
                {k.initials}
              </div>
              <div>
                <h3 className="font-black text-xl leading-tight">{k.name}</h3>
                <p className="text-xs text-foreground/55 font-medium">{k.grade}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Avg grade" value={`${k.avg}%`} icon={<TrendingUp className="size-4 text-primary" />} />
              <Stat label="Streak" value={`${k.streak}d`} icon={<Flame className="size-4 text-streak" />} />
              <Stat label="Courses" value={k.courses} />
              <Stat label="Attendance" value={`${k.attendance}%`} />
            </div>
            <button className="w-full py-2.5 rounded-2xl bg-muted hover:bg-foreground/5 transition-colors font-bold text-sm">
              View detailed progress
            </button>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-muted/50">
      <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-black font-mono text-lg mt-1">{value}</div>
    </div>
  );
}
