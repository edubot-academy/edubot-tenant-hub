import { Zap } from "lucide-react";

export function LaunchQuizHero() {
  return (
    <div
      className="col-span-12 lg:col-span-8 relative overflow-hidden chunky-secondary rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[280px] animate-bounce-in"
      style={{ animationDelay: "100ms" }}
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-foreground/15 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase mb-4">
          <span className="size-1.5 bg-accent rounded-full animate-pulse" />
          Live Session
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-2">Launch Live Quiz</h2>
        <p className="text-secondary-foreground/70 max-w-sm font-medium">
          Share the PIN with your class and start the arena for today's session.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-4 flex-wrap">
        <div className="bg-secondary-foreground/10 backdrop-blur-md border border-secondary-foreground/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-mono text-2xl sm:text-3xl font-bold tracking-widest">
          442 901
        </div>
        <button className="px-8 py-4 bg-card text-secondary rounded-2xl font-black text-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer chunky-shadow">
          <Zap className="size-5 fill-secondary" strokeWidth={2.5} />
          START NOW
        </button>
      </div>

      {/* Decorative shapes */}
      <div className="absolute -right-12 -bottom-12 size-64 bg-secondary-foreground/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-24 top-10 size-12 bg-accent rounded-xl rotate-12 animate-float pointer-events-none chunky-shadow" />
      <div className="absolute right-48 bottom-16 size-8 bg-primary rounded-lg -rotate-12 animate-float pointer-events-none" style={{ animationDelay: "1s" }} />
    </div>
  );
}
