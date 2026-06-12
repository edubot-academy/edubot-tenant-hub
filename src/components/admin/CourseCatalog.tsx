import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Plus } from "lucide-react";

const courses = [
  { id: 1, key: "c1", instructor: "Aris B.", students: 45, lessons: 24, status: "published" },
  { id: 2, key: "c2", instructor: "Saltanat T.", students: 32, lessons: 18, status: "published" },
  { id: 3, key: "c3", instructor: "Marat K.", students: 0, lessons: 8, status: "draft" },
  { id: 4, key: "c4", instructor: "Aris B.", students: 56, lessons: 30, status: "published" },
];

const statusStyles: Record<string, string> = {
  published: "bg-primary/15 text-primary",
  draft: "bg-muted text-foreground/70",
};

export function CourseCatalog() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  return (
    <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <BookOpen className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{getCourseLibraryLabel(locale)}</h3>
        <button className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold cursor-pointer hover:opacity-90">
          <Plus className="size-3.5" strokeWidth={3} />
          {t("admin.catalog.new")}
        </button>
      </div>
      <ul className="divide-y divide-border/60">
        {courses.map((course) => (
          <li key={course.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
            <div className="size-10 rounded-lg bg-muted grid place-items-center">
              <BookOpen className="size-4 text-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{t(`admin.catalog.items.${course.key}`)}</div>
              <div className="text-xs text-foreground/55 font-medium truncate">
                {course.instructor} · {numberFormatter.format(course.lessons)} {t("admin.catalog.lessons")} · {numberFormatter.format(course.students)} {t("admin.catalog.students")}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[course.status]}`}>
              {t(`admin.catalog.status.${course.status}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getCourseLibraryLabel(locale: string) {
  const language = locale.split("-")[0];
  if (language === "ky") return "Курстар китепканасы";
  if (language === "ru") return "Библиотека курсов";
  return "Course Library";
}
