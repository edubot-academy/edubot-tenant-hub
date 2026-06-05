import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";

const stats = [
  { key: "gradedToday", value: "18", delta: "+4 vs yest." },
  { key: "avgTime", value: "6m", delta: "−1m" },
  { key: "responseTime", value: "42m", delta: "−12m" },
  { key: "slaCompliance", value: "96%", delta: "+2%" },
];

const sparkline = [4, 6, 5, 8, 7, 9, 12, 10, 14, 11, 13, 18];
const max = Math.max(...sparkline);

export function AnalyticsSnapshot() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <BarChart3 className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {t("assistant.analytics.title")}
        </h3>
        <span className="text-xs font-mono text-foreground/50 ml-auto">
          {t("assistant.analytics.last7")}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.key} className="p-3 bg-muted/30 rounded-lg border border-border/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/55">
              {t(`assistant.analytics.${s.key}`)}
            </div>
            <div className="text-2xl font-black tabular-nums font-mono leading-tight mt-1">
              {s.value}
            </div>
            <div className="text-[11px] font-semibold text-primary mt-0.5">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        <div className="flex items-end gap-1 h-16">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/70 rounded-sm"
              style={{ height: `${(v / max) * 100}%` }}
              aria-hidden
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-foreground/40 mt-2">
          <span>−12d</span>
          <span>{t("assistant.analytics.gradingVelocity")}</span>
          <span>now</span>
        </div>
      </div>
    </section>
  );
}
