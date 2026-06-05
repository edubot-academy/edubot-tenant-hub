import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Search, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/instructor/students")({
  head: () => ({ meta: [{ title: "QuestLMS — Students" }] }),
  component: StudentsPage,
});

type Trend = "up" | "down" | "flat";
type Student = {
  id: string;
  name: string;
  email: string;
  cls: string;
  progress: number;
  grade: string;
  attendance: number;
  lastActive: string;
  trend: Trend;
};

const seed: Student[] = [
  { id: "1", name: "Mia Chen", email: "mia.c@school.edu", cls: "Cognitive Psych", progress: 78, grade: "A", attendance: 96, lastActive: "2h ago", trend: "up" },
  { id: "2", name: "A. Murat", email: "a.murat@school.edu", cls: "Cognitive Psych", progress: 64, grade: "B+", attendance: 88, lastActive: "1d ago", trend: "flat" },
  { id: "3", name: "B. Tilek", email: "b.tilek@school.edu", cls: "Calculus", progress: 41, grade: "C", attendance: 72, lastActive: "3d ago", trend: "down" },
  { id: "4", name: "D. Kanysh", email: "d.kanysh@school.edu", cls: "Org. Chem II", progress: 86, grade: "A-", attendance: 94, lastActive: "5h ago", trend: "up" },
  { id: "5", name: "E. Aibek", email: "e.aibek@school.edu", cls: "Calculus", progress: 58, grade: "B", attendance: 81, lastActive: "Yesterday", trend: "flat" },
  { id: "6", name: "F. Saltanat", email: "f.salt@school.edu", cls: "Cognitive Psych", progress: 92, grade: "A", attendance: 99, lastActive: "1h ago", trend: "up" },
  { id: "7", name: "G. Nurzat", email: "g.nurzat@school.edu", cls: "Org. Chem II", progress: 33, grade: "D+", attendance: 64, lastActive: "1w ago", trend: "down" },
];

const classes = ["All", "Cognitive Psych", "Calculus", "Org. Chem II"];

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendTone = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  flat: "text-foreground/50",
};

function StudentsPage() {
  const [cls, setCls] = useState("All");
  const [q, setQ] = useState("");
  const items = seed.filter((s) => (cls === "All" || s.cls === cls) && (s.name + s.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell>
      <TopBar title="Students" subtitle="Roster across every class you teach" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Total", v: seed.length },
          { l: "Avg progress", v: `${Math.round(seed.reduce((n, s) => n + s.progress, 0) / seed.length)}%` },
          { l: "Avg attendance", v: `${Math.round(seed.reduce((n, s) => n + s.attendance, 0) / seed.length)}%` },
          { l: "At risk", v: seed.filter((s) => s.progress < 50).length },
        ].map((s) => (
          <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
            <p className="text-2xl font-black font-mono mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-card border-2 border-border rounded-2xl px-4 chunky-shadow">
          <Search className="size-4 text-foreground/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="bg-transparent outline-none flex-1 py-3 text-sm font-medium" />
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <button key={c} onClick={() => setCls(c)} className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${cls === c ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_80px_80px_100px_80px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-foreground/50 border-b-2 border-border bg-muted/40">
          <span>Student</span><span>Class</span><span>Progress</span><span>Grade</span><span>Attend.</span><span>Last active</span><span></span>
        </div>
        <ul>
          {items.map((s) => {
            const TIcon = trendIcon[s.trend];
            return (
              <li key={s.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_80px_80px_100px_80px] gap-3 px-5 py-3 items-center border-b border-border last:border-0 hover:bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="size-9 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center font-black text-xs border-2 border-foreground">{s.name.split(" ").map((p) => p[0]).join("")}</span>
                  <span className="min-w-0">
                    <span className="block font-black text-sm truncate">{s.name}</span>
                    <span className="block text-[11px] font-medium text-foreground/50 truncate">{s.email}</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground/70">{s.cls}</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 flex-1 bg-muted rounded-full overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${s.progress}%` }} /></span>
                  <span className={`text-xs font-black font-mono inline-flex items-center gap-0.5 ${trendTone[s.trend]}`}><TIcon className="size-3" strokeWidth={3} />{s.progress}</span>
                </span>
                <span className="font-black font-mono">{s.grade}</span>
                <span className="font-mono font-bold text-sm">{s.attendance}%</span>
                <span className="text-[11px] font-bold text-foreground/50">{s.lastActive}</span>
                <Link to="/instructor/messages" className="inline-flex items-center justify-center size-9 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors" title="Message">
                  <MessageSquare className="size-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardShell>
  );
}
