import { FileText, ClipboardCheck, Award, Activity, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  icon: LucideIcon;
  label: string;
  detail: string;
  count: number;
  tone: "destructive" | "accent" | "primary" | "secondary";
};

const items: Item[] = [
  { icon: ClipboardCheck, label: "Homework needs review", detail: "Across 3 courses", count: 12, tone: "destructive" },
  { icon: FileText, label: "Attendance to mark", detail: "From today's sessions", count: 4, tone: "accent" },
  { icon: Award, label: "Certificates pending", detail: "Approve & issue", count: 7, tone: "primary" },
  { icon: Activity, label: "Activity needs review", detail: "Submitted past 24h", count: 9, tone: "secondary" },
];

const toneMap: Record<Item["tone"], { bg: string; text: string; ring: string }> = {
  destructive: { bg: "bg-destructive/10", text: "text-destructive", ring: "hover:border-destructive/40" },
  accent: { bg: "bg-accent/20", text: "text-accent-foreground", ring: "hover:border-accent/50" },
  primary: { bg: "bg-primary/10", text: "text-primary", ring: "hover:border-primary/50" },
  secondary: { bg: "bg-secondary/10", text: "text-secondary", ring: "hover:border-secondary/50" },
};

export function AttentionQueue() {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "100ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-black">Admin Attention Queue</h3>
          <p className="text-xs font-bold text-foreground/50">{total} open items across the tenant</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
          Needs you
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, detail, count, tone }) => {
          const c = toneMap[tone];
          return (
            <button
              key={label}
              className={`text-left flex items-center gap-3 p-3 rounded-2xl border-2 border-border transition-colors ${c.ring}`}
            >
              <div className={`size-11 rounded-2xl ${c.bg} grid place-items-center shrink-0`}>
                <Icon className={`size-5 ${c.text}`} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black font-mono leading-none ${c.text}`}>{count}</span>
                  <span className="text-sm font-bold truncate">{label}</span>
                </div>
                <p className="text-[11px] font-medium text-foreground/50 truncate">{detail}</p>
              </div>
              <ArrowRight className="size-4 text-foreground/30 shrink-0" strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
