import { Video, Clock, Users } from "lucide-react";

type Session = {
  time: string;
  course: string;
  topic: string;
  attendees: number;
  status: "live" | "upcoming" | "soon";
};

const sessions: Session[] = [
  { time: "10:00", course: "Cognitive Psychology", topic: "Memory & Encoding", attendees: 42, status: "live" },
  { time: "13:30", course: "Organic Chemistry II", topic: "Aromatic Reactions", attendees: 31, status: "soon" },
  { time: "16:00", course: "Cognitive Psychology", topic: "Lab — fMRI Walkthrough", attendees: 18, status: "upcoming" },
];

const statusStyles: Record<Session["status"], { dot: string; label: string; chip: string }> = {
  live: { dot: "bg-destructive animate-pulse", label: "LIVE", chip: "bg-destructive text-destructive-foreground" },
  soon: { dot: "bg-accent", label: "IN 30 MIN", chip: "bg-accent text-accent-foreground" },
  upcoming: { dot: "bg-foreground/30", label: "UPCOMING", chip: "bg-muted text-foreground/60" },
};

export function TodaySessions() {
  return (
    <div className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-secondary/10 grid place-items-center">
            <Video className="size-5 text-secondary" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Today's Sessions</h3>
            <p className="text-xs font-bold text-foreground/50">3 scheduled · 1 live now</p>
          </div>
        </div>
        <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
          Calendar
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((s, i) => {
          const st = statusStyles[s.status];
          return (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-2xl border-2 border-border hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-col items-center justify-center w-14 shrink-0">
                <Clock className="size-3 text-foreground/40 mb-1" strokeWidth={2.5} />
                <span className="text-sm font-black font-mono">{s.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`size-2 rounded-full ${st.dot}`} />
                  <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded ${st.chip}`}>
                    {st.label}
                  </span>
                </div>
                <p className="text-sm font-bold truncate">{s.topic}</p>
                <p className="text-[11px] font-medium text-foreground/50 truncate">{s.course}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-bold text-foreground/60 inline-flex items-center gap-1">
                  <Users className="size-3" strokeWidth={2.5} />
                  {s.attendees}
                </span>
                {s.status === "live" ? (
                  <button className="chunky-primary px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider">
                    Join
                  </button>
                ) : (
                  <button className="text-[11px] font-bold text-foreground/50 hover:text-primary">
                    Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
