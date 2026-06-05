import { Users, CalendarDays, ClipboardCheck, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

type Tile = {
  icon: typeof Users;
  labelKey: string;
  value: string;
  trend: string;
  tone: "primary" | "secondary" | "accent" | "muted";
};

const tiles: Tile[] = [
  { icon: Users, labelKey: "instructor.insights.activeStudents", value: "128", trend: "+8 this week", tone: "primary" },
  { icon: CalendarDays, labelKey: "instructor.insights.sessionsWeek", value: "12", trend: "3 today", tone: "secondary" },
  { icon: ClipboardCheck, labelKey: "instructor.insights.pendingGrading", value: "24", trend: "5 overdue", tone: "accent" },
  { icon: TrendingUp, labelKey: "instructor.insights.avgCompletion", value: "78%", trend: "+4% MoM", tone: "muted" },
];

const toneStyles: Record<Tile["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/20 text-accent-foreground",
  muted: "bg-muted text-foreground",
};

export function InsightsRow() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-bounce-in" style={{ animationDelay: "150ms" }}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.labelKey}
            className="p-5 bg-card border-2 border-border rounded-[24px] chunky-shadow flex flex-col gap-3"
          >
            <div className={`size-10 rounded-xl grid place-items-center ${toneStyles[tile.tone]}`}>
              <Icon className="size-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none">{tile.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground/60 mt-2">
                {t(tile.labelKey)}
              </div>
              <div className="text-xs font-semibold text-foreground/50 mt-1">{tile.trend}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
