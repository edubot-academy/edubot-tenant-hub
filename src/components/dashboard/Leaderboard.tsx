import { Crown, Flame, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

import { useAppContext } from "@/lib/app-context";
import { useWeeklyLeaderboard } from "@/lib/leaderboard-api";

type ProtoRow = { rank: number; name: string; xp: number; streak: number; avatar: string };

const PROTO_ROWS: ProtoRow[] = [
  { rank: 1, name: "Julian V.", xp: 4902, streak: 12, avatar: a3 },
  { rank: 2, name: "Maria S.", xp: 4210, streak: 5, avatar: a2 },
  { rank: 3, name: "Alex Chen", xp: 3980, streak: 8, avatar: a1 },
];

const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-accent/10", text: "text-accent-foreground", border: "border-accent/40" },
  2: { bg: "bg-muted", text: "text-foreground/50", border: "border-border" },
  3: { bg: "bg-streak/10", text: "text-streak", border: "border-streak/20" },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Student Leaders</h3>
        <span className="text-[10px] font-black text-streak bg-streak/10 px-2 py-1 rounded-lg uppercase tracking-wider">
          This week
        </span>
      </div>
      <div className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow space-y-3 animate-bounce-in" style={{ animationDelay: "500ms" }}>
        {children}
        <Link
          to="/leagues"
          className="block w-full pt-4 text-center text-xs font-black text-foreground/40 hover:text-foreground transition-colors uppercase tracking-widest"
        >
          View Full Table
        </Link>
      </div>
    </div>
  );
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function BackendLeaderboard() {
  const leaderQuery = useWeeklyLeaderboard(1, 3);
  const rows = leaderQuery.data?.items ?? [];

  if (leaderQuery.isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-5 animate-spin text-foreground/40" />
        </div>
      </Shell>
    );
  }

  if (rows.length === 0) {
    return (
      <Shell>
        <p className="text-center text-sm font-medium text-foreground/50 py-4">No leaderboard data yet.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      {rows.map((r, i) => {
        const rank = i + 1;
        const c = rankColors[rank] ?? rankColors[3];
        return (
          <div key={r.studentId} className={`flex items-center gap-4 p-3 rounded-2xl border-2 ${c.bg} ${c.border}`}>
            <span className={`text-2xl font-black w-6 text-center ${c.text}`}>{rank}</span>
            {r.avatarUrl ? (
              <img
                src={r.avatarUrl}
                alt={`${r.fullName} avatar`}
                width={40}
                height={40}
                loading="lazy"
                className="size-10 rounded-full object-cover bg-muted border-2 border-card"
              />
            ) : (
              <div className="size-10 rounded-full bg-muted border-2 border-card grid place-items-center text-xs font-black text-foreground/60">
                {initials(r.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{r.fullName}</p>
              <p className="text-[10px] font-mono font-bold text-foreground/40 tracking-wider">{r.xp.toLocaleString()} XP</p>
            </div>
            {rank === 1 ? (
              <Crown className="size-5 text-accent fill-accent" strokeWidth={2} />
            ) : (
              <span className="text-xs font-bold text-streak inline-flex items-center gap-0.5">
                <Flame className="size-3 fill-streak" strokeWidth={2} />
                {r.streakDays ?? 0}
              </span>
            )}
          </div>
        );
      })}
    </Shell>
  );
}

export function Leaderboard() {
  const { context } = useAppContext();

  if (context.mode === "backend") return <BackendLeaderboard />;

  return (
    <Shell>
      {PROTO_ROWS.map((r) => {
        const c = rankColors[r.rank];
        return (
          <div key={r.rank} className={`flex items-center gap-4 p-3 rounded-2xl border-2 ${c.bg} ${c.border}`}>
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
              <p className="text-[10px] font-mono font-bold text-foreground/40 tracking-wider">{r.xp.toLocaleString()} XP</p>
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
    </Shell>
  );
}
