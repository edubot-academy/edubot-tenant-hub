import { useTranslation } from "react-i18next";
import { TrendingUp, CheckCircle2, CalendarCheck } from "lucide-react";

const stats = [
  { key: "completion", value: "82%", icon: TrendingUp, tone: "primary" },
  { key: "avgGrade", value: "A−", icon: CheckCircle2, tone: "secondary" },
  { key: "attendance", value: "94%", icon: CalendarCheck, tone: "accent" },
] as const;

const toneStyles: Record<(typeof stats)[number]["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/20 text-accent-foreground",
};

export function ProgressRecap() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-xl sm:text-2xl font-black">{t("parent.progress.title")}</h3>
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
          {t("parent.progress.thisMonth")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="p-4 bg-muted/40 rounded-2xl border border-border/60">
              <div className={`size-9 rounded-xl grid place-items-center ${toneStyles[s.tone]}`}>
                <Icon className="size-4" strokeWidth={2.5} />
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums mt-3">{s.value}</div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground/60 mt-1">
                {t(`parent.progress.${s.key}`)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="text-xs font-bold uppercase tracking-wider text-primary/80">
          {t("parent.progress.weeklyNote")}
        </div>
        <p className="text-sm font-semibold mt-1">{t("parent.progress.weeklyText")}</p>
      </div>
    </section>
  );
}
