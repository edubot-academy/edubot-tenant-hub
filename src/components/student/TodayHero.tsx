import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Clock, Sparkles } from "lucide-react";

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    joinable: diff <= 15 * 60 * 1000, // join window: last 15 min
    diff,
  };
}

export function TodayHero() {
  const { t } = useTranslation();
  // Next session: today at 18:00 local; if past, tomorrow same time
  const target = (() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  })();
  const { h, m, s, joinable } = useCountdown(target);

  return (
    <div
      className="col-span-12 lg:col-span-8 relative overflow-hidden chunky-primary rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[280px] animate-bounce-in"
      style={{ animationDelay: "100ms" }}
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-foreground/15 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase mb-4">
          <span className="size-1.5 bg-accent rounded-full animate-pulse" />
          {t("student.today.tag")}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-2">
          {t("student.today.title")}
        </h2>
        <p className="text-primary-foreground/80 max-w-md font-medium text-sm sm:text-base">
          {t("student.today.subtitle")}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-mono text-2xl sm:text-3xl font-bold tracking-widest flex items-center gap-2">
          <Clock className="size-5 opacity-60" strokeWidth={2.5} />
          {h}:{m}:{s}
        </div>
        <button
          disabled={!joinable}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-card text-primary rounded-2xl font-black text-base sm:text-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer chunky-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Video className="size-5" strokeWidth={2.5} />
          {joinable ? t("student.today.joinNow") : t("student.today.opensSoon")}
        </button>
      </div>

      <div className="absolute -right-12 -bottom-12 size-64 bg-primary-foreground/10 rounded-full blur-2xl pointer-events-none" />
      <Sparkles
        className="absolute right-8 top-8 size-10 text-accent opacity-80 animate-float pointer-events-none"
        strokeWidth={2}
      />
      <div
        className="absolute right-32 bottom-24 size-8 bg-accent rounded-lg rotate-12 animate-float pointer-events-none chunky-shadow"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}
