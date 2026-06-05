import { ClipboardCheck, AlertCircle } from "lucide-react";

type Status = "pending" | "needs_revision" | "submitted" | "graded";

const stats: Record<Status, number> = {
  pending: 12,
  needs_revision: 4,
  submitted: 18,
  graded: 76,
};

const statusMeta: Record<Status, { label: string; chip: string; dot: string }> = {
  pending: { label: "Pending", chip: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  needs_revision: { label: "Needs revision", chip: "bg-accent/20 text-accent-foreground", dot: "bg-accent" },
  submitted: { label: "Submitted", chip: "bg-primary/10 text-primary", dot: "bg-primary" },
  graded: { label: "Graded", chip: "bg-streak/10 text-streak", dot: "bg-streak" },
};

type Item = {
  student: string;
  course: string;
  assignment: string;
  status: Status;
  age: string;
};

const items: Item[] = [
  { student: "Maria S.", course: "Cog. Psych", assignment: "Essay 3 — Working Memory", status: "submitted", age: "2d" },
  { student: "Julian V.", course: "Org. Chem II", assignment: "Lab Report 4", status: "pending", age: "4d" },
  { student: "Alex Chen", course: "Cog. Psych", assignment: "Quiz Revision", status: "needs_revision", age: "1d" },
  { student: "Sofia P.", course: "Org. Chem II", assignment: "Problem Set 6", status: "pending", age: "6d" },
  { student: "Iris N.", course: "Cog. Psych", assignment: "Reflection — fMRI", status: "submitted", age: "3h" },
];

export function HomeworkQueue() {
  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-accent/20 grid place-items-center">
            <ClipboardCheck className="size-5 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Homework Queue</h3>
            <p className="text-xs font-bold text-foreground/50">Track submissions across courses</p>
          </div>
        </div>
        <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
          Review all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {(Object.keys(stats) as Status[]).map((k) => {
          const m = statusMeta[k];
          return (
            <div key={k} className={`rounded-2xl px-3 py-3 ${m.chip}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{m.label}</p>
              <p className="text-2xl font-black font-mono leading-none mt-1">{stats[k]}</p>
            </div>
          );
        })}
      </div>

      <ul className="space-y-2">
        {items.map((q, i) => {
          const m = statusMeta[q.status];
          return (
            <li
              key={i}
              className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border hover:border-accent/50 transition-colors cursor-pointer"
            >
              <div className="size-9 rounded-xl bg-muted grid place-items-center shrink-0">
                <span className="text-xs font-black text-foreground/60">
                  {q.student.split(" ").map((p) => p[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{q.assignment}</p>
                <p className="text-[11px] font-medium text-foreground/50 truncate">
                  {q.student} · {q.course}
                </p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg inline-flex items-center gap-1 shrink-0 ${m.chip}`}>
                <span className={`size-1.5 rounded-full ${m.dot}`} />
                {m.label}
              </span>
              <span className="text-[10px] font-bold text-foreground/40 font-mono w-8 text-right shrink-0 inline-flex items-center justify-end gap-0.5">
                {(q.status === "pending" && Number(q.age.replace(/\D/g, "")) >= 3) && (
                  <AlertCircle className="size-3 text-destructive" strokeWidth={2.5} />
                )}
                {q.age}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
