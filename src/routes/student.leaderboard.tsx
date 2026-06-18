import { createFileRoute } from "@tanstack/react-router";
import { Crown, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { XpLeague } from "@/components/student/XpLeague";
import { useAppContext } from "@/lib/app-context";
import { type LeaderboardEntry, useLeaderboardMe, useWeeklyLeaderboard } from "@/lib/leaderboard-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/student/leaderboard")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.leaderboard.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: StudentLeaderboardPage,
});

const protoPlayers = [
  { id: "1", name: "Aibek S.", xp: 6420, streak: 28 },
  { id: "2", name: "Saltanat N.", xp: 5980, streak: 21 },
  { id: "3", name: "Kanysh D.", xp: 5210, streak: 14 },
  { id: "me", name: "You (Maria)", xp: 4280, streak: 12, me: true },
  { id: "4", name: "Tilek B.", xp: 4010, streak: 9 },
  { id: "5", name: "Aris M.", xp: 3760, streak: 6 },
  { id: "6", name: "Nurzat G.", xp: 3500, streak: 5 },
];

function StudentLeaderboardPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const weeklyQuery = useWeeklyLeaderboard(1, 50);
  const meQuery = useLeaderboardMe();

  const myRank = meQuery.data?.rank ?? null;
  const myXp = meQuery.data?.xp ?? null;

  const subtitle =
    context.mode === "backend" && meQuery.data?.rank
      ? t("studentPages.leaderboard.rankedSubtitle", { rank: meQuery.data.rank })
      : t("studentPages.leaderboard.subtitle");

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.leaderboard.title")} subtitle={subtitle} showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <XpLeague />
        </div>
        <div className="col-span-12 lg:col-span-7 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
          <h3 className="font-black text-xl mb-3">{t("studentPages.leaderboard.thisWeek")}</h3>
          {context.mode === "backend" && meQuery.data ? (
            <div className="space-y-3">
              {meQuery.data.rank && (
                <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-black text-primary">
                  {t("studentPages.leaderboard.myWeek", { rank: meQuery.data.rank, xp: meQuery.data.windowXp.toLocaleString() })}
                </div>
              )}
              {meQuery.data.nextTarget && (
                <p className="text-sm font-medium text-foreground/65">
                  {t("studentPages.leaderboard.xpToReach", { xp: meQuery.data.nextTarget.xpGap.toLocaleString(), rank: meQuery.data.nextTarget.rank, label: meQuery.data.nextTarget.label })}
                </p>
              )}
              {meQuery.data.percentile != null && (
                <p className="text-xs font-bold text-foreground/50">
                  {t("studentPages.leaderboard.topPercent", { percent: meQuery.data.percentile })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground/60 font-medium">
              {t("studentPages.leaderboard.prototypeHint")}
            </p>
          )}
        </div>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        {context.mode !== "backend" ? (
          <PrototypeList />
        ) : weeklyQuery.isLoading ? (
          <LeaderboardSkeleton />
        ) : weeklyQuery.isError ? (
          <p className="p-6 text-center text-sm font-medium text-destructive">{t("studentPages.leaderboard.loadFailed")}</p>
        ) : !weeklyQuery.data?.items.length ? (
          <p className="p-6 text-center text-sm font-medium text-foreground/60">{t("studentPages.leaderboard.noData")}</p>
        ) : (
          <BackendList items={weeklyQuery.data.items} myXp={myXp} myRank={myRank} />
        )}
      </section>
    </DashboardShell>
  );
}

function Podium({ entries }: { entries: { name: string; xp: number }[] }) {
  if (entries.length < 3) return null;
  const order = [
    { entry: entries[1], medal: "🥈", height: "h-16", borderColor: "border-zinc-400/30", bg: "bg-zinc-400/10", rank: 2 },
    { entry: entries[0], medal: "🥇", height: "h-24", borderColor: "border-yellow-400/30", bg: "bg-yellow-400/10", rank: 1 },
    { entry: entries[2], medal: "🥉", height: "h-12", borderColor: "border-amber-700/30", bg: "bg-amber-700/10", rank: 3 },
  ];
  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-4 pb-2">
      {order.map(({ entry, medal, height, borderColor, bg, rank }) => (
        <div key={rank} className="flex-1 flex flex-col items-center gap-1">
          <p className="text-[11px] font-black truncate w-full text-center px-1">{entry.name}</p>
          <p className="text-[10px] font-bold text-foreground/50 font-mono">{entry.xp.toLocaleString()}</p>
          <div className={`w-full ${height} border-t-2 border-x-2 ${borderColor} ${bg} rounded-t-xl flex items-end justify-center pb-2`}>
            <span className="text-xl">{medal}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackendList({ items, myXp, myRank }: { items: LeaderboardEntry[]; myXp: number | null; myRank: number | null }) {
  const { t } = useTranslation();
  return (
    <>
      <Podium entries={items.slice(0, 3).map((e) => ({ name: e.fullName, xp: e.xp }))} />
    <ol className="divide-y divide-border">
      {items.map((entry, i) => {
        const isMe = myXp !== null && entry.xp === myXp && myRank === i + 1;
        return (
          <li
            key={entry.studentId}
            className={`flex items-center gap-4 p-3 rounded-2xl ${isMe ? "bg-primary/10 ring-2 ring-primary/30" : ""}`}
          >
            <div className="size-10 grid place-items-center rounded-xl font-black font-mono shrink-0 bg-muted">
              {i < 3 ? (
                <Crown className={`size-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-amber-700"}`} strokeWidth={2.5} />
              ) : (
                `#${i + 1}`
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black truncate">{entry.fullName}{isMe ? ` (${t("studentPages.leaderboard.you")})` : ""}</p>
              {entry.streakDays != null && (
                <p className="text-xs text-foreground/50 font-medium flex items-center gap-1">
                  <Flame className="size-3 text-streak" /> {t("studentPages.leaderboard.dayStreak", { count: entry.streakDays })}
                </p>
              )}
            </div>
            <span className="font-mono font-black text-lg shrink-0">{entry.xp.toLocaleString()} XP</span>
          </li>
        );
      })}
    </ol>
    </>
  );
}

function PrototypeList() {
  const { t } = useTranslation();
  return (
    <>
      <Podium entries={protoPlayers.slice(0, 3).map((p) => ({ name: p.name, xp: p.xp }))} />
      <ol className="divide-y divide-border">
      {protoPlayers.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-4 p-3 rounded-2xl ${"me" in p && p.me ? "bg-primary/10 ring-2 ring-primary/30" : ""}`}
        >
          <div className="size-10 grid place-items-center rounded-xl font-black font-mono shrink-0 bg-muted">
            {i < 3 ? <Crown className={`size-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-amber-700"}`} strokeWidth={2.5} /> : `#${i + 1}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black truncate">{p.name}</p>
            <p className="text-xs text-foreground/50 font-medium flex items-center gap-1">
              <Flame className="size-3 text-streak" /> {t("studentPages.leaderboard.dayStreak", { count: p.streak })}
            </p>
          </div>
          <span className="font-mono font-black text-lg shrink-0">{p.xp.toLocaleString()} XP</span>
        </li>
      ))}
    </ol>
    </>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
