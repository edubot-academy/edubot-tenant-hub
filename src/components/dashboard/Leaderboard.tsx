import { Crown, Flame } from "lucide-react";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

type Row = { rank: number; name: string; xp: number; streak: number; avatar: string };

const rows: Row[] = [
  { rank: 1, name: "Julian V.", xp: 4902, streak: 12, avatar: a3 },
  { rank: 2, name: "Maria S.", xp: 4210, streak: 5, avatar: a2 },
  { rank: 3, name: "Alex Chen", xp: 3980, streak: 8, avatar: a1 },
];

const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-accent/10", text: "text-accent-foreground", border: "border-accent/40" },
  2: { bg: "bg-muted", text: "text-foreground/50", border: "border-border" },
  3: { bg: "bg-streak/10", text: "text-streak", border: "border-streak/20" },
};

export function Leaderboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Student Leaders</h3>
        <span className="text-[10px] font-black text-streak bg-streak/10 px-2 py-1 rounded-lg uppercase tracking-wider">
          League A
        </span>
      </div>

      <div
        className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow space-y-3 animate-bounce-in"
        style={{ animationDelay: "500ms" }}
      >
        {rows.map((r) => {
          const c = rankColors[r.rank];
          return (
            <div
              key={r.rank}
              className={`flex items-center gap-4 p-3 rounded-2xl border-2 ${c.bg} ${c.border}`}
            >
              <span className={`text-2xl font-black w-6 text-center ${c.text}`}>{r.rank}</span>
              <img
                src={r.avatar}
                alt={`${r.name} avatar`}
                width={40}
                height={40}
                loading="lazy"
                className="size-10 rounded-full object-cover bg-muted border-2 border-card"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{r.name}</p>
                <p className="text-[10px] font-mono font-bold text-foreground/40 tracking-wider">
                  {r.xp.toLocaleString()} XP
                </p>
              </div>
              {r.rank === 1 ? (
                <Crown className="size-5 text-accent fill-accent" strokeWidth={2} />
              ) : (
                <span className="text-xs font-bold text-streak inline-flex items-center gap-0.5">
                  <Flame className="size-3 fill-streak" strokeWidth={2} />
                  {r.streak}
                </span>
              )}
            </div>
          );
        })}

        <button className="w-full pt-4 text-xs font-black text-foreground/40 hover:text-foreground transition-colors uppercase tracking-widest">
          View Full Table
        </button>
      </div>
    </div>
  );
}
