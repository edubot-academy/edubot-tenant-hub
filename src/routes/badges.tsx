import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Award, Lock, Sparkles } from "lucide-react";
import { BADGES, useGamification, type Badge } from "@/lib/gamification";
import { useState } from "react";

export const Route = createFileRoute("/badges")({
  head: () => ({ meta: [{ title: "QuestLMS — Badges & Achievements" }] }),
  component: BadgesPage,
});

const cats: { id: Badge["category"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "milestone", label: "Milestones" },
  { id: "streak", label: "Streaks" },
  { id: "mastery", label: "Mastery" },
  { id: "social", label: "Social" },
];

function BadgesPage() {
  const { state } = useGamification();
  const [cat, setCat] = useState<Badge["category"] | "all">("all");

  const filtered = BADGES.filter((b) => cat === "all" || b.category === cat);
  const unlockedCount = state.unlocked.length;

  return (
    <DashboardShell>
      <TopBar title="Badges & Achievements" subtitle={`${unlockedCount} of ${BADGES.length} unlocked`} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Unlocked", value: unlockedCount, sub: `of ${BADGES.length}` },
          { label: "Rarest", value: "💎", sub: "Diamond club" },
          { label: "Closest", value: "🏔️", sub: `${30 - state.streak} days to Unstoppable` },
          { label: "Recent", value: "⚡", sub: "Week warrior" },
        ].map((s) => (
          <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/60">{s.label}</p>
            <p className="text-3xl font-black mt-1">{s.value}</p>
            <p className="text-xs font-bold text-foreground/50 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex bg-card border-2 border-border rounded-2xl p-1 chunky-shadow mb-5 overflow-x-auto">
        {cats.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${cat === c.id ? "bg-foreground text-background" : "text-foreground/60"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((b) => {
          const unlocked = state.unlocked.includes(b.id);
          return (
            <article key={b.id}
              className={`relative aspect-square rounded-3xl border-2 chunky-shadow p-4 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 ${
                unlocked
                  ? "bg-gradient-to-br from-primary/20 via-card to-secondary/20 border-primary"
                  : "bg-card border-border opacity-70"
              }`}>
              <div className={`text-5xl mb-2 ${unlocked ? "" : "grayscale opacity-40"}`}>{b.emoji}</div>
              <p className="font-black text-sm leading-tight">{b.name}</p>
              <p className="text-[10px] font-medium text-foreground/60 mt-1 line-clamp-2">{b.description}</p>
              {!unlocked && (
                <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-background border-2 border-border">
                  <Lock className="size-3" strokeWidth={3} />
                </div>
              )}
              {unlocked && (
                <div className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-foreground">
                  <Sparkles className="size-3" strokeWidth={3} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-center mt-8 text-xs font-bold text-foreground/50 inline-flex items-center gap-2 w-full justify-center">
        <Award className="size-4" /> Keep learning — new badges unlock automatically.
      </p>
    </DashboardShell>
  );
}
