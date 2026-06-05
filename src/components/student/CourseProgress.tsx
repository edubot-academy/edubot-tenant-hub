import { useTranslation } from "react-i18next";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import coverPsych from "@/assets/cover-psych.jpg";
import coverChem from "@/assets/cover-chem.jpg";

interface Course {
  cover: string;
  titleKey: string;
  pct: number;
  xp: number;
  xpGoal: number;
  nextLessonKey: string;
  accent: "primary" | "secondary";
}

const courses: Course[] = [
  { cover: coverPsych, titleKey: "student.courses.psych", pct: 62, xp: 1240, xpGoal: 2000, nextLessonKey: "student.courses.psychNext", accent: "primary" },
  { cover: coverChem, titleKey: "student.courses.chem", pct: 41, xp: 820, xpGoal: 2000, nextLessonKey: "student.courses.chemNext", accent: "secondary" },
];

export function CourseProgress() {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">{t("student.courses.title")}</h3>
        <Link to="/student/courses" className="text-sm font-bold text-primary hover:underline">{t("student.courses.viewAll")}</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {courses.map((c, i) => {
          const accentRing = c.accent === "primary" ? "bg-primary" : "bg-secondary";
          const chipBg = c.accent === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
          return (
            <article
              key={c.titleKey}
              className="bg-card border-2 border-border rounded-[28px] overflow-hidden chunky-shadow group hover:border-foreground/20 transition-colors animate-bounce-in"
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={c.cover}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${chipBg}`}>
                  {c.pct}%
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="font-black text-lg truncate">{t(c.titleKey)}</h4>
                  <p className="text-xs font-medium text-foreground/50 mt-0.5">
                    {t("student.courses.xpProgress", { xp: c.xp.toLocaleString(), goal: c.xpGoal.toLocaleString() })}
                  </p>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${accentRing} transition-all`} style={{ width: `${c.pct}%` }} />
                </div>
                <Link to="/course-player" className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl bg-muted hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayCircle className="size-5 text-foreground/70 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-bold truncate">{t(c.nextLessonKey)}</span>
                  </div>
                  <ArrowRight className="size-4 text-foreground/40 shrink-0" strokeWidth={2.5} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
