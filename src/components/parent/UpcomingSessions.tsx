import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";

const sessions = [
  { id: 1, key: "s1", day: "MON", date: "10", time: "10:00" },
  { id: 2, key: "s2", day: "TUE", date: "11", time: "14:30" },
  { id: 3, key: "s3", day: "THU", date: "13", time: "16:00" },
];

export function UpcomingSessions() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-6 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-brand-primary-soft text-primary grid place-items-center">
          <CalendarDays className="size-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black flex-1">{t("parent.upcoming.title")}</h3>
      </div>

      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border/60"
          >
            <div className="size-12 rounded-xl bg-card border-2 border-border grid place-items-center text-center shrink-0">
              <div className="text-[10px] font-black tracking-wider text-foreground/60">{s.day}</div>
              <div className="text-base font-black leading-none">{s.date}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{t(`parent.upcoming.items.${s.key}`)}</div>
              <div className="text-xs text-foreground/55 font-medium font-mono">{s.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
