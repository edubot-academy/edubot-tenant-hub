import { createFileRoute } from "@tanstack/react-router";
import { Crown, Flame, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import { type LeaderboardEntry, type LeaderboardSummary, useLeaderboardMe, useWeeklyLeaderboard } from "@/lib/leaderboard-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/leagues")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.leagues.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: LeaguesPage,
});

function LeaguesPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const weeklyQuery = useWeeklyLeaderboard(1, 50);
  const meQuery = useLeaderboardMe();

  const participantCount = weeklyQuery.data?.total ?? 0;
  const subtitle =
    context.mode === "backend" && participantCount > 0
      ? t("studentPages.leagues.participants", { count: participantCount })
      : t("studentPages.leagues.subtitle");

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.leagues.title")} subtitle={subtitle} />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("studentPages.leagues.prototypeNotice")}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.8fr]">
          <div className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
            <div className="flex items-center gap-3 border-b-2 border-border px-5 py-4">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><Trophy className="size-5" /></span>
              <h3 className="font-black text-lg">{t("studentPages.leagues.weeklyStandings")}</h3>
            </div>

            {weeklyQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : weeklyQuery.isError ? (
              <p className="p-8 text-center text-sm font-medium text-destructive">{t("studentPages.leagues.loadFailed")}</p>
            ) : !weeklyQuery.data?.items.length ? (
              <p className="p-8 text-center text-sm font-medium text-foreground/60">{t("studentPages.leagues.noParticipants")}</p>
            ) : (
              <ol className="divide-y divide-border">
                {weeklyQuery.data.items.map((entry, i) => (
                  <LeagueRow key={entry.studentId} entry={entry} rank={i + 1} />
                ))}
              </ol>
            )}
          </div>

          <div className="space-y-4">
            {meQuery.data && <MySummaryCard summary={meQuery.data as LeaderboardSummary} />}
            <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-3">{t("studentPages.leagues.howItWorks")}</p>
              <ul className="space-y-2 text-sm font-medium text-foreground/70">
                <li>• {t("studentPages.leagues.rule1")}</li>
                <li>• {t("studentPages.leagues.rule2")}</li>
                <li>• {t("studentPages.leagues.rule3")}</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function LeagueRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <div className="size-9 grid place-items-center rounded-xl font-black font-mono shrink-0 bg-muted text-sm">
        {rank <= 3 ? (
          <Crown className={`size-4 ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-zinc-400" : "text-amber-700"}`} strokeWidth={2.5} />
        ) : (
          `#${rank}`
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm truncate">{entry.fullName}</p>
        {entry.streakDays != null && (
          <p className="text-xs text-foreground/50 font-medium flex items-center gap-1">
            <Flame className="size-3 text-streak" /> {t("studentPages.common.daysShort", { count: entry.streakDays })}
          </p>
        )}
      </div>
      <span className="font-mono font-black shrink-0">{entry.xp.toLocaleString()}</span>
    </li>
  );
}

function MySummaryCard({ summary }: { summary: LeaderboardSummary }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-3">{t("studentPages.leagues.yourStanding")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/50 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("studentPages.leagues.rank")}</p>
          <p className="text-2xl font-black font-mono mt-1">#{summary.rank ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("studentPages.leagues.xpThisWeek")}</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.windowXp.toLocaleString()}</p>
        </div>
      </div>
      {summary.nextTarget && (
        <p className="mt-3 text-xs font-medium text-foreground/60">
          {t("studentPages.leagues.xpToRank", { xp: summary.nextTarget.xpGap.toLocaleString(), rank: summary.nextTarget.rank })}
        </p>
      )}
    </div>
  );
}
