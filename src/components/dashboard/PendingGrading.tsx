import { FileText, AlertCircle } from "lucide-react";

type Submission = { student: string; course: string; assignment: string; age: string; overdue: boolean };

const queue: Submission[] = [
  { student: "Maria S.", course: "Cog. Psych", assignment: "Essay 3 — Working Memory", age: "2d", overdue: false },
  { student: "Julian V.", course: "Org. Chem II", assignment: "Lab Report 4", age: "4d", overdue: true },
  { student: "Alex Chen", course: "Cog. Psych", assignment: "Quiz Revision", age: "1d", overdue: false },
  { student: "Sofia P.", course: "Org. Chem II", assignment: "Problem Set 6", age: "6d", overdue: true },
];

export function PendingGrading() {
  return (
    <div className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-accent/20 grid place-items-center">
            <FileText className="size-5 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Pending Grading</h3>
            <p className="text-xs font-bold text-foreground/50">23 submissions · 5 overdue</p>
          </div>
        </div>
        <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
          Grade all
        </button>
      </div>

      <ul className="space-y-2">
        {queue.map((q, i) => (
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
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg inline-flex items-center gap-1 shrink-0 ${
                q.overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground/60"
              }`}
            >
              {q.overdue && <AlertCircle className="size-3" strokeWidth={2.5} />}
              {q.age}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
