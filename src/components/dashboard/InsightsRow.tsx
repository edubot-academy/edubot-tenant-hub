import { Users, CalendarDays, ClipboardCheck, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/lib/app-context";
import { useInstructorAnalyticsOverview } from "@/lib/instructor/instructor-analytics-api";
import { useInstructorGradingQueue } from "@/lib/instructor/instructor-grading-api";
import { useCalendar, weekRange } from "@/lib/calendar-api";

type Tile = {
  icon: typeof Users;
  labelKey: string;
  value: string;
  trendKey: string;
  trendParams?: Record<string, number>;
  tone: "primary" | "secondary" | "accent" | "muted";
};

const PROTO_TILES: Tile[] = [
  { icon: Users, labelKey: "instructor.insights.activeStudents", value: "128", trendKey: "overview.insights.thisWeek", trendParams: { count: 8 }, tone: "primary" },
  { icon: CalendarDays, labelKey: "instructor.insights.sessionsWeek", value: "12", trendKey: "overview.insights.todayCount", trendParams: { count: 3 }, tone: "secondary" },
  { icon: ClipboardCheck, labelKey: "instructor.insights.pendingGrading", value: "24", trendKey: "overview.insights.overdueCount", trendParams: { count: 5 }, tone: "accent" },
  { icon: TrendingUp, labelKey: "instructor.insights.avgCompletion", value: "78%", trendKey: "overview.insights.monthGrowth", trendParams: { value: 4 }, tone: "muted" },
];

const toneStyles: Record<Tile["tone"], string> = {
  primary: "bg-brand-primary-soft text-primary",
  secondary: "bg-brand-secondary-soft text-secondary",
  accent: "bg-brand-accent-soft text-accent",
  muted: "bg-muted text-foreground",
};

function TileGrid({ tiles }: { tiles: Tile[] }) {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-bounce-in" style={{ animationDelay: "150ms" }}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.labelKey} className="p-5 bg-card border-2 border-border rounded-[24px] chunky-shadow flex flex-col gap-3">
            <div className={`size-10 rounded-xl grid place-items-center ${toneStyles[tile.tone]}`}>
              <Icon className="size-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none">{tile.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground/60 mt-2">{t(tile.labelKey)}</div>
              <div className="text-xs font-semibold text-foreground/50 mt-1">
                {t(tile.trendKey, tile.trendParams)}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function BackendInsightsRow() {
  const analyticsQuery = useInstructorAnalyticsOverview();
  const gradingQuery = useInstructorGradingQueue({ status: "submitted", limit: 1 });
  const { from, to } = weekRange(0);
  const calendarQuery = useCalendar(from, to);

  const summary = analyticsQuery.data?.summary;
  const loading = analyticsQuery.isLoading;
  const v = (n: number | undefined, pct = false) =>
    loading ? "—" : pct ? `${Math.round(n ?? 0)}%` : String(n ?? 0);

  const sessionsThisWeek = calendarQuery.data?.items.length ?? 0;
  const today = new Date().toDateString();
  const sessionsToday =
    calendarQuery.data?.items.filter((s) => new Date(s.startsAt).toDateString() === today).length ?? 0;

  const tiles: Tile[] = [
    {
      icon: Users,
      labelKey: "instructor.insights.activeStudents",
      value: v(summary?.totalStudents),
      trendKey: "overview.insights.enrollments",
      trendParams: { count: summary?.totalEnrollments ?? 0 },
      tone: "primary",
    },
    {
      icon: CalendarDays,
      labelKey: "instructor.insights.sessionsWeek",
      value: calendarQuery.isLoading ? "—" : String(sessionsThisWeek),
      trendKey: "overview.insights.todayCount",
      trendParams: { count: sessionsToday },
      tone: "secondary",
    },
    {
      icon: ClipboardCheck,
      labelKey: "instructor.insights.pendingGrading",
      value: gradingQuery.isLoading ? "—" : String(gradingQuery.data?.total ?? 0),
      trendKey: gradingQuery.data?.total ? "overview.insights.needsReview" : "overview.insights.allClear",
      tone: "accent",
    },
    {
      icon: TrendingUp,
      labelKey: "instructor.insights.avgCompletion",
      value: v(summary?.averageCompletionRate, true),
      trendKey: "overview.insights.courses",
      trendParams: { count: summary?.totalCourses ?? 0 },
      tone: "muted",
    },
  ];

  return <TileGrid tiles={tiles} />;
}

export function InsightsRow() {
  const { context } = useAppContext();
  if (context.mode === "backend") return <BackendInsightsRow />;
  return <TileGrid tiles={PROTO_TILES} />;
}
