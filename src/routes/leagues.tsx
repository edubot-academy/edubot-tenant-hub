import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Trophy, ChevronUp, ChevronDown, Minus, Info } from "lucide-react";
import { LEAGUES, useGamification, type LeagueTier } from "@/lib/gamification";

export const Route = createFileRoute("/leagues")({
  head: () => ({ meta: [{ title: "QuestLMS — Leagues" }] }),
  component: LeaguesPage,
});

const standings: { name: string; xp: number; delta: number; me?: boolean }[] = [
  { name: "Aya", xp: 2680, delta: 0 },
  { name: "Ben", xp: 2420, delta: 1 },
  { name: "Mia", xp: 2210, delta: -1 },
  { name: "Noor", xp: 1980, delta: 2 },
  { name: "Theo", xp: 1840, delta: 0 },
  { name: "You", xp: 1340, delta: 3, me: true },
  { name: "Leo", xp: 1290, delta: 0 },
  { name: "Ivy", xp: 1120, delta: -2 },
  { name: "Sam", xp: 980, delta: 1 },
  { name: "Zoe", xp: 720, delta: 0 },
];

const tiers: LeagueTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];

function LeaguesPage() {
  const { state } = useGamification();
  const cur = LEAGUES[state.league];
  const curIdx = tiers.indexOf(state.league);
  const nextTier = tiers[curIdx + 1];
  const nextMin = nextTier ? LEAGUES[nextTier].min : null;

  return (
    <DashboardShell>
      <TopBar title="Leagues" subtitle="Compete with peers each week — top 5 promote." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          {/* Current league hero */}
          <section className={`relative overflow-hidden rounded-3xl border-4 border-foreground chunky-shadow p-6 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20`}>
            <div className="flex items-center gap-4">
              <div className="text-6xl">{cur.emoji}</div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/60">This week's league</p>
                <h2 className="text-3xl font-black mt-1">{cur.name} League</h2>
                <p className="text-sm font-bold text-foreground/70 mt-1">
                  {state.weeklyXp.toLocaleString()} XP this week
                  {nextMin && ` · ${(nextMin - state.weeklyXp).toLocaleString()} more to ${LEAGUES[nextTier!].name}`}
                </p>
              </div>
            </div>
            {nextMin && (
              <div className="mt-4 h-3 w-full bg-background/70 rounded-full overflow-hidden border-2 border-foreground">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (state.weeklyXp / nextMin) * 100)}%` }} />
              </div>
            )}
          </section>

          {/* Standings */}
          <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
            <div className="p-4 border-b-2 border-border flex items-center justify-between">
              <h3 className="font-black text-xl flex items-center gap-2">
                <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Weekly standings
              </h3>
              <div className="text-xs font-bold text-foreground/50 inline-flex items-center gap-1">
                <Info className="size-3" /> Ends Sunday 23:59
              </div>
            </div>
            <ul className="divide-y-2 divide-border">
              {standings.map((p, i) => {
                const zone = i < 5 ? "promote" : i >= standings.length - 2 ? "demote" : "stay";
                return (
                  <li key={p.name}
                    className={`flex items-center gap-3 p-3 ${p.me ? "bg-primary/10" : ""} ${
                      zone === "promote" ? "border-l-4 border-l-primary" : zone === "demote" ? "border-l-4 border-l-destructive" : ""
                    }`}>
                    <span className={`size-9 grid place-items-center rounded-xl font-black ${
                      i === 0 ? "bg-yellow-400 text-black" : i === 1 ? "bg-gray-300 text-black" : i === 2 ? "bg-amber-600 text-white" : "bg-muted"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black truncate ${p.me ? "text-primary" : ""}`}>{p.name}{p.me && " · you"}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                        {zone === "promote" ? "Promotion zone" : zone === "demote" ? "Demotion zone" : "Safe"}
                      </p>
                    </div>
                    <span className="font-mono font-black text-sm">{p.xp.toLocaleString()} XP</span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-black w-10 justify-end ${
                      p.delta > 0 ? "text-primary" : p.delta < 0 ? "text-destructive" : "text-foreground/40"
                    }`}>
                      {p.delta > 0 ? <ChevronUp className="size-4" strokeWidth={3} /> : p.delta < 0 ? <ChevronDown className="size-4" strokeWidth={3} /> : <Minus className="size-3" />}
                      {p.delta !== 0 && Math.abs(p.delta)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* All tiers */}
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3">All leagues</h3>
          <ul className="space-y-2">
            {tiers.map((t) => {
              const L = LEAGUES[t];
              const active = t === state.league;
              return (
                <li key={t} className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${active ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
                  <span className="text-2xl">{L.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black">{L.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">≥ {L.min} weekly XP</p>
                  </div>
                  {active && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-primary text-primary-foreground">You</span>}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </DashboardShell>
  );
}
