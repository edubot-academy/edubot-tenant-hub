import { AlertTriangle } from "lucide-react";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

type Risk = { name: string; avatar: string; reason: string; severity: "high" | "med" };

const list: Risk[] = [
  { name: "Sofia P.", avatar: a2, reason: "3 overdue · streak broken", severity: "high" },
  { name: "Marcus L.", avatar: a1, reason: "Missed last 2 sessions", severity: "high" },
  { name: "Iris N.", avatar: a3, reason: "Quiz avg dropped 18%", severity: "med" },
];

export function AtRiskStudents() {
  return (
    <div className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in" style={{ animationDelay: "600ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-destructive/10 grid place-items-center">
            <AlertTriangle className="size-5 text-destructive" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black">At-Risk Students</h3>
        </div>
      </div>

      <ul className="space-y-2">
        {list.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border hover:border-destructive/40 transition-colors cursor-pointer"
          >
            <img
              src={r.avatar}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="size-10 rounded-full object-cover bg-muted border-2 border-card"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{r.name}</p>
              <p className="text-[11px] font-medium text-foreground/50 truncate">{r.reason}</p>
            </div>
            <span
              className={`size-2.5 rounded-full shrink-0 ${
                r.severity === "high" ? "bg-destructive" : "bg-accent"
              }`}
            />
          </li>
        ))}
      </ul>

      <button className="w-full pt-4 mt-2 text-xs font-black text-foreground/40 hover:text-foreground transition-colors uppercase tracking-widest border-t border-border">
        Reach out · Send nudge
      </button>
    </div>
  );
}
