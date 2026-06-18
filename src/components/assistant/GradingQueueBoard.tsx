import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardCheck, Clock } from "lucide-react";

const submissions = [
  { id: 1, studentKey: "s1", taskKey: "t1", courseKey: "c1", submitted: "2h", status: "pending" },
  { id: 2, studentKey: "s2", taskKey: "t2", courseKey: "c1", submitted: "4h", status: "pending" },
  { id: 3, studentKey: "s3", taskKey: "t3", courseKey: "c2", submitted: "1d", status: "pending" },
  { id: 4, studentKey: "s4", taskKey: "t4", courseKey: "c2", submitted: "1d", status: "review" },
  { id: 5, studentKey: "s5", taskKey: "t5", courseKey: "c1", submitted: "2d", status: "pending" },
  { id: 6, studentKey: "s6", taskKey: "t6", courseKey: "c2", submitted: "3d", status: "pending" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-brand-accent-soft text-accent",
  review: "bg-brand-primary-soft text-brand-primary-text",
};

const filters = ["all", "c1", "c2"] as const;

export function GradingQueueBoard() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const rows = submissions.filter((s) => filter === "all" || s.courseKey === filter);

  return (
    <section className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-foreground/60" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {t("assistant.grading.title")}
          </h3>
          <span className="text-xs font-mono text-foreground/50">({rows.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:bg-muted"
              }`}
            >
              {t(`assistant.grading.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-foreground/55 border-b border-border">
              <th className="text-left p-3">{t("assistant.grading.col.student")}</th>
              <th className="text-left p-3">{t("assistant.grading.col.task")}</th>
              <th className="text-left p-3 hidden sm:table-cell">{t("assistant.grading.col.course")}</th>
              <th className="text-left p-3 hidden md:table-cell">{t("assistant.grading.col.submitted")}</th>
              <th className="text-left p-3">{t("assistant.grading.col.status")}</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="p-3 font-semibold">{t(`assistant.grading.students.${row.studentKey}`)}</td>
                <td className="p-3 text-foreground/75">{t(`assistant.grading.tasks.${row.taskKey}`)}</td>
                <td className="p-3 text-foreground/60 hidden sm:table-cell">
                  {t(`assistant.grading.courses.${row.courseKey}`)}
                </td>
                <td className="p-3 text-foreground/55 font-mono text-xs hidden md:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {row.submitted}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[row.status]}`}
                  >
                    {t(`assistant.grading.statusLabel.${row.status}`)}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button className="text-xs font-bold text-primary hover:underline cursor-pointer">
                    {t("assistant.grading.grade")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
