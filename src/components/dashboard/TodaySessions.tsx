import { Clock, Video, Users, Loader2, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { startOfDay, endOfDay, format } from "date-fns";

import { useAppContext } from "@/lib/app-context";
import { useCalendar } from "@/lib/calendar-api";
import type { CalendarItem } from "@/lib/calendar-api";

const PROTO_SESSIONS = [
  { id: 1, titleKey: "instructor.today.s1", time: "10:00", students: 45, status: "live" as const },
  { id: 2, titleKey: "instructor.today.s2", time: "14:30", students: 32, status: "upcoming" as const },
  { id: 3, titleKey: "instructor.today.s3", time: "18:00", students: 28, status: "upcoming" as const },
];

function Shell({ children, count }: { children: React.ReactNode; count?: number }) {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl sm:text-2xl font-black">{t("instructor.today.title")}</h3>
        {count !== undefined && (
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
            {t("instructor.today.count", { count })}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function sessionTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function isLive(item: CalendarItem) {
  const now = Date.now();
  const start = new Date(item.startsAt).getTime();
  const end = new Date(item.endsAt).getTime();
  return item.status === "scheduled" && now >= start && now <= end;
}

function BackendTodaySessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();
  const calendarQuery = useCalendar(startOfDay(today), endOfDay(today));
  const sessions = calendarQuery.data?.items ?? [];

  if (calendarQuery.isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-foreground/40" />
        </div>
      </Shell>
    );
  }

  if (sessions.length === 0) {
    return (
      <Shell count={0}>
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <CalendarDays className="size-8 text-foreground/25" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground/50">
            {t("overview.today.empty")}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell count={sessions.length}>
      <ul className="space-y-3">
        {sessions.map((s) => {
          const live = isLive(s);
          return (
            <li key={s.id} className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border/60">
              <div className="size-12 rounded-xl bg-card border-2 border-border grid place-items-center font-mono font-bold text-sm shrink-0">
                {sessionTime(s.startsAt)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold truncate">{s.title}</span>
                  {live && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-destructive/15 text-destructive rounded-full text-[10px] font-black uppercase tracking-wider">
                      <span className="size-1.5 bg-destructive rounded-full animate-pulse" />
                      {t("instructor.today.liveTag")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/60 font-medium mt-1">
                  {s.courseTitle && <span className="truncate">{s.courseTitle}</span>}
                  {s.groupName && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {s.groupName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {sessionTime(s.startsAt)}–{sessionTime(s.endsAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: live ? "/live-quiz-host" : "/course-player" })}
                className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 ${
                  live ? "bg-destructive text-destructive-foreground" : "bg-brand-primary-soft text-primary"
                }`}
              >
                <Video className="size-4" strokeWidth={2.5} />
                {live ? t("instructor.today.joinNow") : t("instructor.today.open")}
              </button>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function ProtoTodaySessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Shell count={PROTO_SESSIONS.length}>
      <ul className="space-y-3">
        {PROTO_SESSIONS.map((s) => (
          <li key={s.id} className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border/60">
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
              type="button"
              onClick={() => navigate({ to: s.status === "live" ? "/live-quiz-host" : "/course-player" })}
              className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 ${
                s.status === "live" ? "bg-destructive text-destructive-foreground" : "bg-brand-primary-soft text-primary"
              }`}
            >
              <Video className="size-4" strokeWidth={2.5} />
              {s.status === "live" ? t("instructor.today.joinNow") : t("instructor.today.open")}
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function TodaySessions() {
  const { context } = useAppContext();
  if (context.mode === "backend") return <BackendTodaySessions />;
  return <ProtoTodaySessions />;
}
