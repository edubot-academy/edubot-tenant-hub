import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";

// Sample week: index 0 = Mon. true = completed, "today" = in-progress today
type Day = { state: "done" | "today" | "future" | "missed" };

const week: Day[] = [
  { state: "done" },
  { state: "done" },
  { state: "done" },
  { state: "missed" },
  { state: "done" },
  { state: "today" },
  { state: "future" },
];

export function StreakCalendar() {
  const { t, i18n } = useTranslation();
  const totalStreak = 12;
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { weekday: "short" });
    // 2026-01-05 is a Monday, so this keeps the sample week in Monday → Sunday order.
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(Date.UTC(2026, 0, 5 + index))));
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <div className="bg-card border-2 border-border rounded-[28px] p-5 chunky-shadow animate-bounce-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-streak fill-streak" strokeWidth={2} />
          <h3 className="font-black text-lg">{t("student.streak.title")}</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-streak font-mono">{totalStreak}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
            {t("student.streak.daysShort")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {week.map((d, i) => {
          const base = "aspect-square rounded-xl grid place-items-center text-[10px] font-black border-2 transition-all";
          const stateClass =
            d.state === "done"
              ? "bg-streak text-background border-streak chunky-shadow"
              : d.state === "today"
                ? "bg-accent text-accent-foreground border-accent animate-pulse"
                : d.state === "missed"
                  ? "bg-muted text-foreground/30 border-border"
                  : "bg-card text-foreground/30 border-dashed border-border";
          return (
            <div key={i} aria-label={weekdayLabels[i]} title={weekdayLabels[i]} className={`${base} ${stateClass}`}>
              {d.state === "done" || d.state === "today" ? <Flame className="size-3.5" strokeWidth={2.5} /> : weekdayLabels[i]}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-medium text-foreground/50 text-center">
        {t("student.streak.encourage")}
      </p>
    </div>
  );
}
