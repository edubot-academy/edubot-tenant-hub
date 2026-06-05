import { Calendar, Video, ExternalLink } from "lucide-react";

type Session = { time: string; course: string; topic: string; live?: boolean };
type Group = { key: string; label: string; sessions: Session[] };

const groups: Group[] = [
  {
    key: "today",
    label: "Today",
    sessions: [
      { time: "10:00", course: "Cog. Psych", topic: "Memory & Encoding", live: true },
      { time: "13:30", course: "Org. Chem II", topic: "Aromatic Reactions" },
      { time: "16:00", course: "Cog. Psych", topic: "Lab — fMRI" },
    ],
  },
  {
    key: "tomorrow",
    label: "Tomorrow",
    sessions: [
      { time: "09:00", course: "Org. Chem II", topic: "Tutorial — PS6 Review" },
      { time: "14:00", course: "Cog. Psych", topic: "Attention & Focus" },
    ],
  },
];

export function UpcomingSessionsPanel() {
  const total = groups.reduce((s, g) => s + g.sessions.length, 0);
  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "550ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-secondary/10 grid place-items-center">
            <Calendar className="size-5 text-secondary" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Upcoming Sessions</h3>
            <p className="text-xs font-bold text-foreground/50">{total} scheduled</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest hover:underline">
          Next live <ExternalLink className="size-3" strokeWidth={2.5} />
        </button>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 px-1">
              {g.label}
            </h4>
            <ul className="space-y-2">
              {g.sessions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border-2 border-border hover:border-secondary/40 transition-colors"
                >
                  <span className="text-sm font-black font-mono w-12 shrink-0">{s.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.topic}</p>
                    <p className="text-[10px] font-medium text-foreground/50 truncate">{s.course}</p>
                  </div>
                  {s.live ? (
                    <button className="chunky-primary px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <Video className="size-3" strokeWidth={2.5} />
                      Join
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                      Scheduled
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
