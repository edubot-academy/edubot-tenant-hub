import { Zap, Video, CalendarDays } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { startOfDay, endOfDay, format } from "date-fns";

import { useAppContext } from "@/lib/app-context";
import { useCalendar } from "@/lib/calendar-api";
import type { CalendarItem } from "@/lib/calendar-api";

function sessionTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function isLive(item: CalendarItem) {
  const now = Date.now();
  return (
    item.status === "scheduled" &&
    now >= new Date(item.startsAt).getTime() &&
    now <= new Date(item.endsAt).getTime()
  );
}

function isImminentOrLive(item: CalendarItem) {
  const now = Date.now();
  const start = new Date(item.startsAt).getTime();
  return isLive(item) || (item.status === "scheduled" && start > now && start - now <= 60 * 60 * 1000);
}

function BackendLaunchHero() {
  const navigate = useNavigate();
  const today = new Date();
  const calendarQuery = useCalendar(startOfDay(today), endOfDay(today));
  const sessions = calendarQuery.data?.items ?? [];

  const liveSession = sessions.find(isLive);
  const imminentSession = sessions.find((s) => !isLive(s) && isImminentOrLive(s));
  const featured = liveSession ?? imminentSession;

  if (!featured && !calendarQuery.isLoading) {
    return (
      <div
        className="col-span-12 lg:col-span-8 relative overflow-hidden bg-card border-2 border-border rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 flex items-center gap-5 animate-bounce-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="size-14 shrink-0 rounded-2xl bg-muted grid place-items-center">
          <CalendarDays className="size-7 text-foreground/30" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg">No live sessions today</p>
          <p className="text-sm font-medium text-foreground/55 mt-0.5">
            Schedule a session to host a live class or quiz.
          </p>
        </div>
        <Link
          to="/calendar"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/15 transition-colors"
        >
          View calendar
        </Link>
      </div>
    );
  }

  if (calendarQuery.isLoading) {
    return (
      <div
        className="col-span-12 lg:col-span-8 h-24 rounded-[28px] bg-muted animate-pulse"
        style={{ animationDelay: "100ms" }}
      />
    );
  }

  const live = liveSession !== undefined;
  return (
    <div
      className={`col-span-12 lg:col-span-8 relative overflow-hidden rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between min-h-[180px] animate-bounce-in ${
        live ? "chunky-secondary" : "bg-card border-2 border-border"
      }`}
      style={{ animationDelay: "100ms" }}
    >
      <div className="relative z-10">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-3 ${
          live
            ? "bg-secondary-foreground/15 text-secondary-foreground"
            : "bg-primary/10 text-primary"
        }`}>
          <span className={`size-1.5 rounded-full animate-pulse ${live ? "bg-accent" : "bg-primary"}`} />
          {live ? "Live now" : "Starting soon"}
        </span>
        <h2 className={`text-2xl font-extrabold leading-tight ${live ? "" : "text-foreground"}`}>
          {featured!.title}
        </h2>
        <p className={`text-sm font-medium mt-1 ${live ? "text-secondary-foreground/70" : "text-foreground/55"}`}>
          {featured!.courseTitle} · {sessionTime(featured!.startsAt)}–{sessionTime(featured!.endsAt)}
        </p>
      </div>
      <div className="relative z-10 mt-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/live-quiz-host" })}
          className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer chunky-shadow ${
            live
              ? "bg-card text-secondary"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Video className="size-4" strokeWidth={2.5} />
          {live ? "Join now" : "Launch session"}
        </button>
      </div>
      {live && (
        <>
          <div className="absolute -right-12 -bottom-12 size-64 bg-secondary-foreground/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-24 top-10 size-12 bg-accent rounded-xl rotate-12 animate-float pointer-events-none chunky-shadow" />
        </>
      )}
    </div>
  );
}

export function LaunchQuizHero() {
  const { context } = useAppContext();
  if (context.mode === "backend") return <BackendLaunchHero />;

  const navigate = useNavigate();
  const pin = "442 901";

  const handleStart = () => {
    toast.success(`Live quiz started — PIN ${pin}`);
    setTimeout(() => navigate({ to: "/live-quiz-host" }), 350);
  };

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
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(pin.replace(/\s/g, ""));
            toast.success("PIN copied to clipboard");
          }}
          className="bg-secondary-foreground/10 backdrop-blur-md border border-secondary-foreground/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-mono text-2xl sm:text-3xl font-bold tracking-widest hover:bg-secondary-foreground/20 transition-colors cursor-pointer"
          aria-label="Copy quiz PIN"
        >
          {pin}
        </button>
        <button
          type="button"
          onClick={handleStart}
          className="px-8 py-4 bg-card text-secondary rounded-2xl font-black text-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer chunky-shadow"
        >
          <Zap className="size-5 fill-secondary" strokeWidth={2.5} />
          START NOW
        </button>
      </div>

      <div className="absolute -right-12 -bottom-12 size-64 bg-secondary-foreground/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-24 top-10 size-12 bg-accent rounded-xl rotate-12 animate-float pointer-events-none chunky-shadow" />
      <div className="absolute right-48 bottom-16 size-8 bg-primary rounded-lg -rotate-12 animate-float pointer-events-none" style={{ animationDelay: "1s" }} />
    </div>
  );
}
