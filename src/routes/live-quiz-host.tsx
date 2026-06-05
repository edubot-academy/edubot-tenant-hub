import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Users, Play, SkipForward, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/live-quiz-host")({
  head: () => ({ meta: [{ title: "QuestLMS — Live Quiz Host" }] }),
  component: LiveQuizHostPage,
});

const players = [
  "Mia", "Ben", "Noor", "Theo", "Aya", "Leo", "Ivy", "Sam", "Zoe", "Kai", "Eli", "Ada",
];

const colors = ["bg-[#e63946]", "bg-[#1d99f3]", "bg-[#f4a261]", "bg-[#52b788]"];
const labels = ["A", "B", "C", "D"];

function LiveQuizHostPage() {
  const [phase, setPhase] = useState<"lobby" | "question" | "reveal">("lobby");
  const [joined, setJoined] = useState(4);
  const [time, setTime] = useState(20);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const pin = "734 218";

  useEffect(() => {
    if (phase !== "lobby") return;
    const id = setInterval(() => setJoined((j) => Math.min(players.length, j + 1)), 1800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "question") return;
    if (time <= 0) { setPhase("reveal"); return; }
    const id = setInterval(() => {
      setTime((t) => t - 1);
      setCounts((c) => c.map((v) => v + Math.floor(Math.random() * 2)));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, time]);

  const total = counts.reduce((a, b) => a + b, 0) || 1;

  return (
    <DashboardShell>
      <TopBar title="Live Quiz — Host" subtitle="Working Memory · 10 questions" showStreak={false} />

      {phase === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <section className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Join at questlms.live</p>
            <p className="text-7xl sm:text-8xl font-black tracking-tight font-mono">{pin}</p>
            <p className="text-sm font-bold text-foreground/60">Enter this code on your device</p>
            <button onClick={() => { setPhase("question"); setTime(20); setCounts([0, 0, 0, 0]); }}
              disabled={joined < 1}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black chunky-shadow disabled:opacity-50">
              <Play className="size-5" strokeWidth={3} /> Start quiz
            </button>
          </section>
          <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-4">
              <Users className="size-4 text-primary" strokeWidth={2.5} /> {joined} players joined
            </h3>
            <div className="flex flex-wrap gap-2">
              {players.slice(0, joined).map((p, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-secondary/30 border-2 border-secondary font-black text-sm animate-in fade-in zoom-in-95">
                  {p}
                </span>
              ))}
            </div>
          </aside>
        </div>
      )}

      {phase === "question" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">Question 3 of 10</p>
            <div className={`size-16 grid place-items-center rounded-2xl border-4 ${time < 6 ? "border-destructive text-destructive" : "border-primary text-primary"} font-mono font-black text-2xl`}>
              {time}
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{total - 1} answered</p>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-8 chunky-shadow text-center">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              In Baddeley's model, which slave system processes verbal information?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Visuospatial sketchpad", "Phonological loop", "Episodic buffer", "Central executive"].map((opt, i) => (
              <div key={i} className={`${colors[i]} text-white rounded-3xl p-6 border-4 border-foreground chunky-shadow flex items-center gap-4`}>
                <span className="size-12 grid place-items-center rounded-2xl bg-white/20 font-black text-xl">{labels[i]}</span>
                <span className="font-black text-lg flex-1 text-left">{opt}</span>
                <span className="font-mono font-black text-sm bg-black/20 px-2 py-1 rounded-lg">{counts[i]}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setPhase("reveal")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background font-bold text-sm chunky-shadow">
            <SkipForward className="size-4" strokeWidth={3} /> Skip to results
          </button>
        </div>
      )}

      {phase === "reveal" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Zap className="size-5 text-primary" strokeWidth={2.5} /> Answer distribution
            </h3>
            <div className="space-y-2">
              {["Visuospatial sketchpad", "Phonological loop", "Episodic buffer", "Central executive"].map((opt, i) => {
                const pct = Math.round((counts[i] / total) * 100);
                const correct = i === 1;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className={correct ? "text-primary" : ""}>{labels[i]}. {opt} {correct && "✓"}</span>
                      <span className="font-mono">{counts[i]} · {pct}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                      <div className={`h-full ${correct ? "bg-primary" : colors[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4">
              <Trophy className="size-5 text-secondary" strokeWidth={2.5} /> Top players
            </h3>
            <ul className="space-y-2">
              {[["Mia", 2840], ["Ben", 2510], ["Noor", 2200], ["Theo", 1980], ["Aya", 1740]].map(([name, score], i) => (
                <li key={name} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <span className="size-9 grid place-items-center rounded-xl bg-foreground text-background font-black">{i + 1}</span>
                  <span className="font-black flex-1">{name}</span>
                  <span className="font-mono font-black text-primary">{score}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => { setPhase("question"); setTime(20); setCounts([0, 0, 0, 0]); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <SkipForward className="size-4" strokeWidth={3} /> Next question
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
