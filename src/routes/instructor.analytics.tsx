import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { TrendingUp, Users, Clock, Award, Activity } from "lucide-react";

export const Route = createFileRoute("/instructor/analytics")({
  head: () => ({ meta: [{ title: "QuestLMS — Instructor Analytics" }] }),
  component: AnalyticsPage,
});

const engagement = [42, 51, 48, 63, 70, 66, 78, 82, 79, 88, 91, 87];
const grades = [
  { label: "A", count: 24, tone: "bg-emerald-500" },
  { label: "B", count: 38, tone: "bg-primary" },
  { label: "C", count: 22, tone: "bg-amber-500" },
  { label: "D", count: 9, tone: "bg-orange-500" },
  { label: "F", count: 3, tone: "bg-rose-500" },
];
const topCourses = [
  { name: "Cognitive Psychology", students: 124, completion: 78, rating: 4.9 },
  { name: "Organic Chemistry II", students: 86, completion: 62, rating: 4.6 },
  { name: "Calculus Foundations", students: 142, completion: 71, rating: 4.7 },
];

function AnalyticsPage() {
  const max = Math.max(...engagement);
  const total = grades.reduce((n, g) => n + g.count, 0);

  return (
    <DashboardShell>
      <TopBar title="Analytics" subtitle="How your students and courses are performing" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Active students", v: "352", d: "+12 this wk", icon: Users },
          { l: "Avg completion", v: "74%", d: "+4% vs last mo", icon: Activity },
          { l: "Avg grade", v: "B+", d: "Stable", icon: Award },
          { l: "Avg watch time", v: "27m", d: "+2m", icon: Clock },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
                <Icon className="size-4 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-2xl font-black font-mono">{s.v}</p>
              <p className="text-[11px] font-bold text-foreground/60 mt-0.5">{s.d}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-5">
        <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4"><TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> Engagement (last 12 weeks)</h3>
          <div className="flex items-end gap-2 h-48">
            {engagement.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-foreground/40">{v}</span>
                <div className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg border-2 border-foreground" style={{ height: `${(v / max) * 100}%` }} />
                <span className="text-[10px] font-bold text-foreground/40">W{i + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
          <h3 className="font-black text-lg mb-4">Grade distribution</h3>
          <div className="space-y-3">
            {grades.map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{g.label}</span>
                  <span className="font-mono">{g.count} · {Math.round((g.count / total) * 100)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
                  <div className={`h-full ${g.tone}`} style={{ width: `${(g.count / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
        <h3 className="font-black text-lg mb-4">Top courses</h3>
        <ul className="space-y-2">
          {topCourses.map((c) => (
            <li key={c.name} className="grid grid-cols-[1fr_80px_120px_80px] gap-3 items-center px-3 py-2.5 rounded-xl bg-muted/40">
              <span className="font-black text-sm">{c.name}</span>
              <span className="text-xs font-bold text-foreground/60 font-mono">{c.students} students</span>
              <span className="flex items-center gap-2">
                <span className="h-2 flex-1 bg-muted rounded-full overflow-hidden border border-border"><span className="block h-full bg-primary" style={{ width: `${c.completion}%` }} /></span>
                <span className="text-xs font-mono font-black">{c.completion}%</span>
              </span>
              <span className="text-xs font-black font-mono text-amber-600">★ {c.rating}</span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
