import { Check, Circle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function SetupChecklist() {
  const { t } = useTranslation();
  const [items, setItems] = useState([
    { key: "profile", done: true },
    { key: "firstCourse", done: true },
    { key: "inviteStudents", done: false },
    { key: "scheduleSession", done: false },
    { key: "launchQuiz", done: false },
  ]);

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);

  if (completed === items.length) return null;

  const toggle = (key: string) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, done: !i.done } : i)));

  return (
    <section
      className="col-span-12 p-6 sm:p-7 bg-card border-2 border-border rounded-[28px] chunky-shadow animate-bounce-in"
      style={{ animationDelay: "100ms" }}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="size-12 rounded-2xl bg-brand-primary-emphasis text-primary grid place-items-center shrink-0">
          <Sparkles className="size-6" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-black leading-tight">
            {t("instructor.setup.title")}
          </h3>
          <p className="text-sm text-foreground/60 font-medium mt-1">
            {t("instructor.setup.subtitle", { completed, total: items.length })}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <div className="text-3xl font-black tabular-nums text-primary">{pct}%</div>
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors text-left cursor-pointer"
            >
              <span
                className={`size-6 rounded-full grid place-items-center shrink-0 ${
                  item.done ? "bg-primary text-primary-foreground" : "border-2 border-border"
                }`}
              >
                {item.done ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Circle className="size-3 opacity-0" />
                )}
              </span>
              <span
                className={`font-semibold ${
                  item.done ? "line-through text-foreground/40" : "text-foreground"
                }`}
              >
                {t(`instructor.setup.items.${item.key}`)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
