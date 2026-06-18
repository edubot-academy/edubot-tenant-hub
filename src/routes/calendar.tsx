import { createFileRoute } from "@tanstack/react-router";
import { format, isSameDay, isToday, isTomorrow, isYesterday } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import { type CalendarItem, useCalendar, weekRange } from "@/lib/calendar-api";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      {
        title: i18n.t("calendarPage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Calendar",
        }),
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const { from, to } = weekRange(weekOffset);
  const calendarQuery = useCalendar(from, to);

  return (
    <DashboardShell>
      <TopBar
        title={t("calendarPage.topbar.title", { defaultValue: "Calendar" })}
        subtitle={t("calendarPage.topbar.subtitle", { defaultValue: "Sessions, deadlines, and events." })}
      />

      {context.mode !== "backend" ? (
        <section className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-foreground/60">
          {t("calendarPage.prototype.body", { defaultValue: "Prototype mode uses a local calendar board." })}
        </section>
      ) : (
        <section className="space-y-4">
          <WeekNav
            from={from}
            to={to}
            weekOffset={weekOffset}
            onPrev={() => setWeekOffset((week) => week - 1)}
            onNext={() => setWeekOffset((week) => week + 1)}
            onToday={() => setWeekOffset(0)}
          />

          {calendarQuery.isLoading ? (
            <CalendarSkeleton />
          ) : calendarQuery.isError ? (
            <div className="rounded-3xl border-2 border-border bg-card p-6 text-sm font-medium text-destructive">
              {t("calendarPage.state.loadFailed", { defaultValue: "Failed to load calendar. Please try again." })}
            </div>
          ) : !calendarQuery.data?.items.length ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center text-sm font-medium text-foreground/60">
              {t("calendarPage.empty.week", { defaultValue: "No sessions scheduled for this week." })}
            </div>
          ) : (
            <CalendarDayList items={calendarQuery.data.items} from={from} to={to} />
          )}
        </section>
      )}
    </DashboardShell>
  );
}

function WeekNav({ from, to, weekOffset, onPrev, onNext, onToday }: { from: Date; to: Date; weekOffset: number; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  const { t, i18n: activeI18n } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3">
      <button onClick={onPrev} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-black text-foreground/70 hover:bg-muted transition-colors">
        <ChevronLeft className="size-4" />
        {t("calendarPage.actions.prev", { defaultValue: "Prev" })}
      </button>

      <div className="flex items-center gap-3">
        <span className="text-sm font-black">
          {formatRange(from, to, activeI18n.language)}
        </span>
        {weekOffset !== 0 && (
          <button onClick={onToday} className="rounded-xl bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary hover:bg-primary/20 transition-colors">
            {t("calendarPage.actions.today", { defaultValue: "Today" })}
          </button>
        )}
      </div>

      <button onClick={onNext} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-black text-foreground/70 hover:bg-muted transition-colors">
        {t("calendarPage.actions.next", { defaultValue: "Next" })}
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function formatRange(from: Date, to: Date, locale: string) {
  return `${from.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${to.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`;
}

function dayLabel(date: Date, t: ReturnType<typeof useTranslation>["t"], locale: string) {
  if (isToday(date)) return t("calendarPage.day.today", { defaultValue: "Today" });
  if (isTomorrow(date)) return t("calendarPage.day.tomorrow", { defaultValue: "Tomorrow" });
  if (isYesterday(date)) return t("calendarPage.day.yesterday", { defaultValue: "Yesterday" });
  return date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

function CalendarDayList({ items, from, to }: { items: CalendarItem[]; from: Date; to: Date }) {
  const { t, i18n: activeI18n } = useTranslation();
  const days: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(new Date(item.startsAt), day));
        if (!dayItems.length) return null;
        return (
          <div key={day.toISOString()}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${isToday(day) ? "text-primary" : "text-foreground/50"}`}>
                {dayLabel(day, t, activeI18n.language)}
              </span>
              <span className="text-[10px] font-bold text-foreground/30">
                {format(day, "yyyy-MM-dd")}
              </span>
            </div>
            <div className="space-y-2">
              {dayItems.map((item) => <CalendarCard key={`${item.type}-${item.id}`} item={item} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarCard({ item }: { item: CalendarItem }) {
  const { i18n: activeI18n } = useTranslation();
  const isAcademic = item.type === "academic_session";
  const contextLabel = isAcademic ? item.className : item.groupName;

  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card px-4 py-3 chunky-shadow">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        {isAcademic ? <GraduationCap className="size-5 text-primary" /> : <BookOpen className="size-5 text-primary" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{item.title}</p>
        <p className="text-xs font-bold text-foreground/60">
          {new Date(item.startsAt).toLocaleTimeString(activeI18n.language, { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {new Date(item.endsAt).toLocaleTimeString(activeI18n.language, { hour: "2-digit", minute: "2-digit" })}
          {contextLabel ? ` · ${contextLabel}` : ""}
          {item.courseTitle ? ` · ${item.courseTitle}` : ""}
        </p>
      </div>

      <StatusBadge status={item.status} />
    </div>
  );
}

function StatusBadge({ status }: { status: CalendarItem["status"] }) {
  const { t } = useTranslation();
  const label = t(`calendarPage.status.${status}`, { defaultValue: status });
  if (status === "completed") {
    return <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{label}</span>;
  }
  if (status === "cancelled") {
    return <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">{label}</span>;
  }
  return <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-foreground/60">{label}</span>;
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((day) => (
        <div key={day}>
          <div className="mb-2 h-3 w-28 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            {[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl border-2 border-border bg-card" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
