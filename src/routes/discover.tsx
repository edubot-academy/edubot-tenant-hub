import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Clock, Search, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { type CatalogCourse, useCourseCatalog } from "@/lib/marketplace-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.discover.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: DiscoverPage,
});

const LEVEL_TONE: Record<string, string> = {
  Beginner:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Advanced:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

function DiscoverPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const catalogQuery = useCourseCatalog({ q: debouncedQ, page, limit: 24 });
  const { items = [], total = 0 } = catalogQuery.data ?? {};
  const totalPages = Math.ceil(total / 24);

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.discover.title")} subtitle={t("studentPages.discover.subtitle")} />

      <div className="flex items-center gap-3 p-3 bg-card border-2 border-border rounded-2xl chunky-shadow max-w-xl mb-6">
        <Search className="size-4 text-foreground/40 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("studentPages.discover.searchPlaceholder")}
          className="flex-1 bg-transparent outline-none text-sm font-medium"
        />
      </div>

      {catalogQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-3xl border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center">
          <p className="font-black text-base">{t("studentPages.discover.noCoursesTitle")}</p>
          <p className="text-sm font-medium text-foreground/55 mt-1">
            {debouncedQ ? t("studentPages.discover.tryDifferentSearch") : t("studentPages.discover.noPublicCourses")}
          </p>
        </div>
      ) : (
        <>
          {total > 0 && (
            <p className="text-xs font-bold text-foreground/50 mb-4">
              {debouncedQ
                ? t("studentPages.discover.resultCountFor", { count: total, query: debouncedQ })
                : t("studentPages.discover.resultCount", { count: total })}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl border-2 border-border bg-card text-xs font-black disabled:opacity-40 hover:not-disabled:-translate-y-0.5 transition-transform"
              >
                {t("studentPages.discover.previous")}
              </button>
              <span className="text-xs font-black text-foreground/50">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl border-2 border-border bg-card text-xs font-black disabled:opacity-40 hover:not-disabled:-translate-y-0.5 transition-transform"
              >
                {t("studentPages.discover.next")}
              </button>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}

function CourseCard({ course }: { course: CatalogCourse }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/course-player"
      search={{ courseId: course.id }}
      className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden hover:-translate-y-1 transition-transform flex flex-col"
    >
      {course.coverImageUrl ? (
        <div className="h-36 bg-muted overflow-hidden">
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-primary/10 to-muted grid place-items-center">
          <BookOpen className="size-10 text-primary/30" strokeWidth={1.5} />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-sm leading-tight flex-1">{course.title}</h3>
          {course.level && (
            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${LEVEL_TONE[course.level] ?? ""}`}>
              {t(`studentPages.discover.level.${course.level}`, { defaultValue: course.level })}
            </span>
          )}
        </div>

        {course.instructor && (
          <p className="text-xs font-medium text-foreground/55">{course.instructor.fullName}</p>
        )}

        <div className="flex items-center gap-3 text-xs font-bold text-foreground/60 mt-auto">
          {course.ratingAverage > 0 && (
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={2} />
              {course.ratingAverage.toFixed(1)}
              {course.ratingCount > 0 && (
                <span className="text-foreground/40">({course.ratingCount})</span>
              )}
            </span>
          )}
          {course.enrolledStudents > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3" strokeWidth={2.5} />
              {course.enrolledStudents.toLocaleString()}
            </span>
          )}
          {course.durationInHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" strokeWidth={2.5} />
              {t("studentPages.common.hoursShort", { count: course.durationInHours })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {course.category && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-foreground/60 text-[10px] font-black">
              {course.category.name}
            </span>
          )}
          <span className="ml-auto text-sm font-black text-primary">
            {course.isPaid ? `$${course.price}` : t("studentPages.discover.free")}
          </span>
        </div>
      </div>
    </Link>
  );
}
