import { useTranslation } from "react-i18next";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { GraduationCap, Zap, Target } from "lucide-react";

const enrollData = [
  { m: "Jan", enroll: 120, active: 3400 },
  { m: "Feb", enroll: 180, active: 3560 },
  { m: "Mar", enroll: 240, active: 3740 },
  { m: "Apr", enroll: 290, active: 3980 },
  { m: "May", enroll: 360, active: 4280 },
  { m: "Jun", enroll: 430, active: 4680 },
];

const completionData = [
  { c: "Psych", v: 78 }, { c: "Chem", v: 65 }, { c: "Math", v: 82 },
  { c: "Bio", v: 71 }, { c: "Hist", v: 58 },
];

export function GlobalAnalytics() {
  const { t } = useTranslation();
  return (
    <>
      <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.analytics.enrollTitle")}</h3>
          <span className="text-xs font-mono text-foreground/50">{t("owner.analytics.last6")}</span>
        </div>
        <div className="h-48">
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
              <Line type="monotone" dataKey="enroll" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.analytics.completionTitle")}</h3>
          <span className="text-xs font-mono text-foreground/50">%</span>
        </div>
        <div className="h-48">
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

      <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.analytics.platformTitle")}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("owner.analytics.totalLearners")}</div>
              <div className="text-xl font-black font-mono">4,680</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
            <div className="size-10 rounded-lg bg-secondary/10 grid place-items-center">
              <Zap className="size-5 text-secondary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("owner.analytics.avgEngagement")}</div>
              <div className="text-xl font-black font-mono">72%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
            <div className="size-10 rounded-lg bg-accent/20 grid place-items-center">
              <Target className="size-5 text-accent-foreground" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("owner.analytics.courseCompletion")}</div>
              <div className="text-xl font-black font-mono">68.4%</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
