import { Activity, UserPlus, FileEdit, Award, BookOpen, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Entry = {
  icon: LucideIcon;
  actor: string;
  action: string;
  target: string;
  time: string;
};

type Group = { key: string; label: string; entries: Entry[] };

const groups: Group[] = [
  {
    key: "today",
    label: "Today",
    entries: [
      { icon: Send, actor: "Maria S.", action: "submitted", target: "Essay 3", time: "12m ago" },
      { icon: FileEdit, actor: "You", action: "graded", target: "Lab Report 2", time: "1h ago" },
      { icon: Award, actor: "System", action: "issued certificate", target: "Cog. Psych Mod 1", time: "3h ago" },
    ],
  },
  {
    key: "yesterday",
    label: "Yesterday",
    entries: [
      { icon: UserPlus, actor: "Iris N.", action: "joined", target: "Org. Chem II", time: "1d ago" },
      { icon: BookOpen, actor: "Prof. Aris", action: "published", target: "Module 4 — Reactions", time: "1d ago" },
    ],
  },
];

export function ActivityFeed() {
  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "600ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-secondary/10 grid place-items-center">
            <Activity className="size-5 text-secondary" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black">Recent Activity</h3>
        </div>
        <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
          All
        </button>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 px-1">
              {g.label}
            </h4>
            <ul className="space-y-1.5">
              {g.entries.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0">
                    <e.icon className="size-3.5 text-foreground/60" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      <span className="font-bold">{e.actor}</span>{" "}
                      <span className="text-foreground/60">{e.action}</span>{" "}
                      <span className="font-bold">{e.target}</span>
                    </p>
                    <p className="text-[10px] font-bold text-foreground/40 font-mono">{e.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
