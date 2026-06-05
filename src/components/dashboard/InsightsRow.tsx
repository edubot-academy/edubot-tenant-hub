import { Users, Calendar, ClipboardCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Stat = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  tone: "primary" | "secondary" | "accent" | "streak";
};

const stats: Stat[] = [
  { icon: Users, label: "Active students", value: "248", delta: "+12 this week", tone: "primary" },
  { icon: Calendar, label: "Sessions this week", value: "18", delta: "6 today", tone: "secondary" },
  { icon: ClipboardCheck, label: "Pending grading", value: "23", delta: "5 overdue", tone: "accent" },
  { icon: TrendingUp, label: "Avg. completion", value: "84%", delta: "+3% vs last week", tone: "streak" },
];

const toneMap: Record<Stat["tone"], { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  secondary: { bg: "bg-secondary/10", text: "text-secondary" },
  accent: { bg: "bg-accent/20", text: "text-accent-foreground" },
  streak: { bg: "bg-streak/10", text: "text-streak" },
};

export function InsightsRow() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map(({ icon: Icon, label, value, delta, tone }, idx) => {
        const c = toneMap[tone];
        return (
          <div
            key={label}
            className="bg-card border-2 border-border rounded-[24px] p-5 chunky-shadow animate-bounce-in"
            style={{ animationDelay: `${100 + idx * 80}ms` }}
          >
            <div className={`size-10 rounded-xl ${c.bg} grid place-items-center mb-3`}>
              <Icon className={`size-5 ${c.text}`} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">
              {label}
            </p>
            <p className="text-3xl font-black font-mono leading-none mb-1.5">{value}</p>
            <p className={`text-xs font-bold ${c.text}`}>{delta}</p>
          </div>
        );
      })}
    </section>
  );
}
