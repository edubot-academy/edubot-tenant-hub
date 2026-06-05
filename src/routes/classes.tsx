import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Users, Calendar, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "QuestLMS — My Classes" }] }),
  component: ClassesPage,
});

const classes = [
  { id: "psych", title: "Cognitive Psychology", code: "PSY-201", students: 38, nextSession: "Today, 18:00", color: "from-primary to-primary/70" },
  { id: "chem", title: "Organic Chemistry II", code: "CHM-302", students: 24, nextSession: "Tomorrow, 10:00", color: "from-secondary to-secondary/70" },
  { id: "math", title: "Intro to Calculus", code: "MTH-101", students: 52, nextSession: "Thu, 14:00", color: "from-accent to-accent/70" },
  { id: "hist", title: "World History — Modern Era", code: "HST-210", students: 19, nextSession: "Fri, 09:00", color: "from-primary to-secondary" },
];

function ClassesPage() {
  return (
    <DashboardShell>
      <TopBar title="My Classes" subtitle="All cohorts you're teaching this term." showStreak={false} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60 font-medium">{classes.length} active classes</p>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity">
          <Plus className="size-4" strokeWidth={3} /> New class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {classes.map((c) => (
          <Link
            key={c.id}
            to="/"
            className="group bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover:border-foreground/20 transition-colors"
          >
            <div className={`h-24 bg-gradient-to-br ${c.color} relative`}>
              <span className="absolute top-3 left-4 text-[10px] font-black uppercase tracking-widest text-white/90">
                {c.code}
              </span>
              <button className="absolute top-3 right-3 size-8 grid place-items-center rounded-lg bg-black/20 text-white hover:bg-black/30">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-black text-lg leading-tight">{c.title}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-foreground/60">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" /> {c.students}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> {c.nextSession}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
