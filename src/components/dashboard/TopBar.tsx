import { Flame } from "lucide-react";
import profAvatar from "@/assets/avatar-prof.jpg";

export function TopBar() {
  return (
    <header className="flex items-center justify-between mb-10 animate-bounce-in">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">
          Good morning, Prof. Aris! <span aria-hidden>👋</span>
        </h1>
        <p className="text-foreground/50 font-medium">
          Your students are crushing their goals today.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <Flame className="size-6 text-streak fill-streak" strokeWidth={2} />
            <span className="text-streak font-black text-2xl">12</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            Day Streak
          </span>
        </div>

        <div className="h-10 w-px bg-border" />

        <div className="flex items-center gap-3 bg-card p-2 pr-5 rounded-2xl border border-border chunky-shadow">
          <img
            src={profAvatar}
            alt="Prof. Aris avatar"
            width={40}
            height={40}
            className="size-10 rounded-xl object-cover bg-muted"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-wider">
              DIAMOND LEAGUE
            </span>
            <span className="text-sm font-bold font-mono">4,280 XP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
