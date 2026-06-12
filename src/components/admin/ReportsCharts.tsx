import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

import "@/lib/overview/overview-i18n";

const enrollmentValues = [120, 180, 240, 290, 360, 430];
const completionKeys = [
  { key: "student.courses.psych", value: 78 },
  { key: "student.courses.chem", value: 65 },
  { key: "nav.assignments", value: 82 },
  { key: "nav.classes", value: 71 },
  { key: "nav.reports", value: 58 },
];

export function ReportsCharts() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  const enrollData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return enrollmentValues.map((value, index) => ({
      m: formatter.format(new Date(Date.UTC(2026, index, 1))),
      v: value,
    }));
  }, [locale]);
  const completionData = useMemo(
    () => completionKeys.map((item) => ({ c: t(item.key), v: item.value })),
    [t],
  );

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
