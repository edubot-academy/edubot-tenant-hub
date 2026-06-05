import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Award, BookOpen, Flame, TrendingUp, Download, Share2 } from "lucide-react";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "QuestLMS — Student Profile" }] }),
  component: StudentProfilePage,
});

const skills = [
  { name: "Memory", value: 84 },
  { name: "Attention", value: 72 },
  { name: "Problem solving", value: 68 },
  { name: "Reading", value: 91 },
  { name: "Writing", value: 76 },
  { name: "Numeracy", value: 64 },
];

const timeline = [
  { date: "Jun 4", title: "Completed quiz: Working Memory", score: "9/10", icon: BookOpen },
  { date: "Jun 2", title: "Earned badge: 7-day streak", icon: Flame },
  { date: "May 30", title: "Submitted essay: Phonological Loop", icon: BookOpen },
  { date: "May 28", title: "Joined class: Cognitive Psychology", icon: BookOpen },
  { date: "May 24", title: "Certificate: Intro to Memory", icon: Award },
];

const certs = [
  { id: "c1", title: "Intro to Memory", issued: "May 24, 2026", grade: "A" },
  { id: "c2", title: "Lab Safety", issued: "Apr 10, 2026", grade: "Pass" },
  { id: "c3", title: "Study Skills 101", issued: "Mar 2, 2026", grade: "A-" },
];

function StudentProfilePage() {
  // Hexagon radar
  const cx = 110, cy = 110, r = 80;
  const points = skills.map((s, i) => {
    const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
    const dist = (s.value / 100) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, lx: cx + Math.cos(angle) * (r + 16), ly: cy + Math.sin(angle) * (r + 16), name: s.name };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    skills.map((_, i) => {
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
    }).join(" ")
  );

  return (
    <DashboardShell>
      <TopBar title="My Profile" subtitle="Your learning story so far" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {/* Header card */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-foreground chunky-shadow">
              MC
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black">Mia Chen</h2>
              <p className="text-sm font-medium text-foreground/60">Year 11 · Joined Sep 2025</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[["XP", "12,840"], ["Streak", "7 days"], ["Badges", "14"], ["Courses", "6"]].map(([k, v]) => (
                  <span key={k} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs">
                    <span className="text-foreground/50">{k} · </span>{v}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow"><Share2 className="size-4" /></button>
              <button className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow"><Download className="size-4" /></button>
            </div>
          </section>

          {/* Skill graph */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-primary" strokeWidth={2.5} /> Skill graph
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <svg viewBox="0 0 220 220" className="w-[220px] h-[220px] shrink-0">
                {grid.map((g, i) => (
                  <polygon key={i} points={g} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
                ))}
                <polygon points={polygon} fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill="hsl(var(--primary))" />
                    <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-current">
                      {p.name}
                    </text>
                  </g>
                ))}
              </svg>
              <ul className="flex-1 w-full space-y-2">
                {skills.map((s) => (
                  <li key={s.name} className="space-y-1">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{s.name}</span>
                      <span className="font-mono">{s.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${s.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Certificates */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Award className="size-5 text-secondary" strokeWidth={2.5} /> Certificates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {certs.map((c) => (
                <div key={c.id} className="border-2 border-border rounded-2xl p-4 bg-gradient-to-br from-secondary/20 to-accent/20">
                  <Award className="size-6 text-secondary mb-2" strokeWidth={2.5} />
                  <p className="font-black text-sm leading-tight">{c.title}</p>
                  <p className="text-xs font-bold text-foreground/50 mt-1">{c.issued}</p>
                  <p className="text-xs font-black text-primary mt-2">Grade: {c.grade}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Timeline */}
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-xl mb-4">Activity timeline</h3>
          <ol className="relative border-l-2 border-border ml-3 space-y-5">
            {timeline.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="ml-5">
                  <span className="absolute -left-[13px] size-6 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-background">
                    <Icon className="size-3" strokeWidth={3} />
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{e.date}</p>
                  <p className="font-bold text-sm mt-0.5">{e.title}</p>
                  {e.score && <p className="text-xs font-mono font-black text-primary mt-0.5">{e.score}</p>}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </DashboardShell>
  );
}
