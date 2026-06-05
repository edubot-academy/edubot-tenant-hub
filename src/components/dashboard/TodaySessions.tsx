import { Clock, Video, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

const sessions = [
  { id: 1, titleKey: "instructor.today.s1", time: "10:00", students: 45, status: "live" as const },
  { id: 2, titleKey: "instructor.today.s2", time: "14:30", students: 32, status: "upcoming" as const },
  { id: 3, titleKey: "instructor.today.s3", time: "18:00", students: 28, status: "upcoming" as const },
];

export function TodaySessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl sm:text-2xl font-black">{t("instructor.today.title")}</h3>
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
          {t("instructor.today.count", { count: sessions.length })}
        </span>
      </div>

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border/60"
          >
            <div className="size-12 rounded-xl bg-card border-2 border-border grid place-items-center font-mono font-bold text-sm shrink-0">
              {s.time}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold truncate">{t(s.titleKey)}</span>
                {s.status === "live" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-destructive/15 text-destructive rounded-full text-[10px] font-black uppercase tracking-wider">
                    <span className="size-1.5 bg-destructive rounded-full animate-pulse" />
                    {t("instructor.today.liveTag")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground/60 font-medium mt-1">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" /> {s.students}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> 60m
                </span>
              </div>
            </div>
            <button
              className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 ${
                s.status === "live"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Video className="size-4" strokeWidth={2.5} />
              {s.status === "live" ? t("instructor.today.joinNow") : t("instructor.today.open")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
