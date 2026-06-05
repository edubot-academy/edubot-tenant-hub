import { useTranslation } from "react-i18next";
import { Gem, ChevronRight } from "lucide-react";

const LEAGUES = ["Bronze", "Silver", "Gold", "Sapphire", "Ruby", "Diamond"];

export function XpLeague() {
  const { t } = useTranslation();
  const xp = 4280;
  const nextXp = 5000;
  const pct = Math.round((xp / nextXp) * 100);
  const leagueIdx = 5;

  return (
    <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground rounded-[28px] p-5 chunky-shadow animate-bounce-in relative overflow-hidden" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Gem className="size-5 text-accent fill-accent" strokeWidth={2} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {t(`student.league.${LEAGUES[leagueIdx].toLowerCase()}`, { defaultValue: LEAGUES[leagueIdx] })} {t("student.league.tag")}
          </span>
        </div>
        <button className="text-[10px] font-bold opacity-70 hover:opacity-100 flex items-center gap-0.5">
          {t("student.league.viewAll")} <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="flex items-baseline gap-2 mb-3 relative z-10">
        <span className="text-4xl font-black font-mono">{xp.toLocaleString()}</span>
        <span className="text-sm font-bold opacity-60">/ {nextXp.toLocaleString()} XP</span>
      </div>

      <div className="h-2.5 w-full bg-secondary-foreground/15 rounded-full overflow-hidden mb-3 relative z-10">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-xs font-medium opacity-70 relative z-10">
        {t("student.league.nextRank", { xp: (nextXp - xp).toLocaleString() })}
      </p>

      <Gem className="absolute -right-6 -bottom-6 size-32 text-accent opacity-20 rotate-12" strokeWidth={1.5} />
    </div>
  );
}
