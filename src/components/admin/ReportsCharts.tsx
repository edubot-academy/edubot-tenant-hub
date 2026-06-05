import { useTranslation } from "react-i18next";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const enrollData = [
  { m: "Jan", v: 120 }, { m: "Feb", v: 180 }, { m: "Mar", v: 240 },
  { m: "Apr", v: 290 }, { m: "May", v: 360 }, { m: "Jun", v: 430 },
];
const completionData = [
  { c: "Psych", v: 78 }, { c: "Chem", v: 65 }, { c: "Math", v: 82 },
  { c: "Bio", v: 71 }, { c: "Hist", v: 58 },
];

export function ReportsCharts() {
  const { t } = useTranslation();
  return (
    <>
      <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.reports.enrollTitle")}</h3>
          <span className="text-xs font-mono text-foreground/50">{t("admin.reports.last6")}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.reports.completionTitle")}</h3>
          <span className="text-xs font-mono text-foreground/50">%</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="c" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="v" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
