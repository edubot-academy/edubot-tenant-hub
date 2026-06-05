import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { XpLeague } from "@/components/student/XpLeague";
import { Crown, Flame } from "lucide-react";

export const Route = createFileRoute("/student/leaderboard")({
  head: () => ({ meta: [{ title: "QuestLMS — Leaderboard" }] }),
  component: StudentLeaderboardPage,
});

const players = [
  { id: "1", name: "Aibek S.", xp: 6420, streak: 28 },
  { id: "2", name: "Saltanat N.", xp: 5980, streak: 21 },
  { id: "3", name: "Kanysh D.", xp: 5210, streak: 14 },
  { id: "me", name: "You (Maria)", xp: 4280, streak: 12, me: true },
  { id: "4", name: "Tilek B.", xp: 4010, streak: 9 },
  { id: "5", name: "Aris M.", xp: 3760, streak: 6 },
  { id: "6", name: "Nurzat G.", xp: 3500, streak: 5 },
];

function StudentLeaderboardPage() {
  return (
    <DashboardShell>
      <TopBar title="Leaderboard" subtitle="See where you stand in the Diamond League this week." showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <XpLeague />
        </div>
        <div className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl mb-3">This week</h3>
          <p className="text-sm text-foreground/60 font-medium">
            Top 3 advance to the next league on Sunday. Keep grinding — you're closer than you think.
          </p>
        </div>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        <ol className="divide-y divide-border">
          {players.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-4 p-3 rounded-2xl ${p.me ? "bg-primary/10 ring-2 ring-primary/30" : ""}`}
            >
              <div className="size-10 grid place-items-center rounded-xl font-black font-mono shrink-0 bg-muted">
                {i < 3 ? <Crown className={`size-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-amber-700"}`} strokeWidth={2.5} /> : `#${i + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{p.name}</p>
                <p className="text-xs text-foreground/50 font-medium flex items-center gap-1">
                  <Flame className="size-3 text-streak" /> {p.streak} day streak
                </p>
              </div>
              <span className="font-mono font-black text-lg shrink-0">{p.xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      </section>
    </DashboardShell>
  );
}
