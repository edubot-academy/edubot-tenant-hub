import { ClipboardCheck, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const queue = [
  { id: 1, nameKey: "instructor.grading.s1", courseKey: "instructor.grading.c1", due: "today" },
  { id: 2, nameKey: "instructor.grading.s2", courseKey: "instructor.grading.c1", due: "today" },
  { id: 3, nameKey: "instructor.grading.s3", courseKey: "instructor.grading.c2", due: "tomorrow" },
  { id: 4, nameKey: "instructor.grading.s4", courseKey: "instructor.grading.c2", due: "overdue" },
];

const dueStyles: Record<string, string> = {
  today: "bg-accent/20 text-accent-foreground",
  tomorrow: "bg-muted text-foreground/70",
  overdue: "bg-destructive/15 text-destructive",
};

export function GradingQueue() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-4 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-secondary/10 text-secondary grid place-items-center">
          <ClipboardCheck className="size-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black flex-1">{t("instructor.grading.title")}</h3>
      </div>

      <ul className="space-y-2 flex-1">
        {queue.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{t(item.nameKey)}</div>
              <div className="text-xs text-foreground/55 font-medium truncate">{t(item.courseKey)}</div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${dueStyles[item.due]}`}
            >
              {t(`instructor.grading.due.${item.due}`)}
            </span>
          </li>
        ))}
      </ul>

      <button className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/15 transition-colors cursor-pointer">
        {t("instructor.grading.openAll")}
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </button>
    </section>
  );
}
