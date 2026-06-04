import { Flame } from "lucide-react";

type ClassCardProps = {
  cover: string;
  title: string;
  students: number;
  xp: number;
  xpGoal: number;
  avgStreak: string;
  accent: "primary" | "secondary";
  delay?: number;
  avatars: string[];
};

export function ClassCard({
  cover,
  title,
  students,
  xp,
  xpGoal,
  avgStreak,
  accent,
  delay = 0,
  avatars,
}: ClassCardProps) {
  const pct = Math.round((xp / xpGoal) * 100);
  const barClass = accent === "primary" ? "bg-primary" : "bg-secondary";
  const hoverBorder = accent === "primary" ? "hover:border-primary/50" : "hover:border-secondary/50";

  return (
    <div
      className={`bg-card border-2 border-border rounded-[32px] overflow-hidden chunky-shadow group ${hoverBorder} transition-colors animate-bounce-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-32 relative overflow-hidden">
        <img
          src={cover}
          alt={`${title} cover`}
          width={1024}
          height={512}
          loading="lazy"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          {students} Students
        </div>
      </div>
      <div className="p-6">
        <h4 className="text-xl font-bold mb-4">{title}</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-black text-foreground/40 uppercase mb-2">
              <span>Course XP</span>
              <span className="font-mono">
                {xp.toLocaleString()} / {(xpGoal / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full ${barClass} rounded-full transition-all duration-1000`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs font-bold flex items-center gap-1">
              Avg. Streak:{" "}
              <span className="text-streak inline-flex items-center gap-0.5">
                <Flame className="size-3 fill-streak" strokeWidth={2} />
                {avgStreak}
              </span>
            </span>
            <div className="flex -space-x-2">
              {avatars.map((a, i) => (
                <img
                  key={i}
                  src={a}
                  alt=""
                  width={24}
                  height={24}
                  loading="lazy"
                  className="size-6 rounded-full border-2 border-card object-cover bg-muted"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
