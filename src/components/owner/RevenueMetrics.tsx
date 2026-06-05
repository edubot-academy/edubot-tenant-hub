import { useTranslation } from "react-i18next";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";

const revenueData = [
  { m: "Jan", mrr: 12400, arr: 148800 },
  { m: "Feb", mrr: 13200, arr: 158400 },
  { m: "Mar", mrr: 14500, arr: 174000 },
  { m: "Apr", mrr: 15800, arr: 189600 },
  { m: "May", mrr: 17200, arr: 206400 },
  { m: "Jun", mrr: 19100, arr: 229200 },
];

const kpi = [
  { labelKey: "owner.revenue.mrr", value: "$19.1K", change: "+11%", up: true, icon: DollarSign },
  { labelKey: "owner.revenue.arr", value: "$229K", change: "+11%", up: true, icon: DollarSign },
  { labelKey: "owner.revenue.churn", value: "2.1%", change: "-0.3pp", up: true, icon: TrendingDown },
  { labelKey: "owner.revenue.arpu", value: "$8.40", change: "+4%", up: true, icon: Users },
];

export function RevenueMetrics() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.revenue.title")}</h3>
        <span className="text-xs font-mono text-foreground/50">{t("owner.revenue.last6")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {kpi.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.labelKey} className="bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(item.labelKey)}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-black font-mono">{item.value}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${item.up ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                  {item.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
            />
            <Area type="monotone" dataKey="mrr" stroke="var(--primary)" strokeWidth={2} fill="url(#mrrFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
