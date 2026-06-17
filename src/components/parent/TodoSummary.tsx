import { useTranslation } from "react-i18next";
import { AlertCircle, Clock } from "lucide-react";

const todos = [
  { id: 1, key: "t1", course: "c1", due: "overdue" },
  { id: 2, key: "t2", course: "c1", due: "today" },
  { id: 3, key: "t3", course: "c2", due: "tomorrow" },
];

const dueStyles: Record<string, string> = {
  overdue: "bg-destructive/15 text-destructive",
  today: "bg-brand-accent-soft text-accent",
  tomorrow: "bg-muted text-foreground/70",
};

export function TodoSummary() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-6 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-brand-accent-soft text-accent grid place-items-center">
          <AlertCircle className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black">{t("parent.todo.title")}</h3>
          <p className="text-xs text-foreground/55 font-medium">{t("parent.todo.subtitle")}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60"
          >
            <Clock className="size-4 text-foreground/40 shrink-0" strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{t(`parent.todo.items.${todo.key}`)}</div>
              <div className="text-xs text-foreground/55 font-medium truncate">
                {t(`parent.todo.courses.${todo.course}`)}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${dueStyles[todo.due]}`}
            >
              {t(`parent.todo.due.${todo.due}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
