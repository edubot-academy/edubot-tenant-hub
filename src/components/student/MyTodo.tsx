import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle, RotateCcw, FileText, Inbox } from "lucide-react";

type Status = "open" | "overdue" | "submitted" | "needsRevision" | "completed";

interface Todo {
  id: string;
  titleKey: string;
  courseKey: string;
  dueLabelKey: string;
  status: Status;
}

const todos: Todo[] = [
  { id: "1", titleKey: "student.todo.items.essay", courseKey: "student.courses.psych", dueLabelKey: "student.todo.due.today", status: "open" },
  { id: "2", titleKey: "student.todo.items.problemSet", courseKey: "student.courses.chem", dueLabelKey: "student.todo.due.yesterday", status: "overdue" },
  { id: "3", titleKey: "student.todo.items.quiz", courseKey: "student.courses.psych", dueLabelKey: "student.todo.due.tomorrow", status: "open" },
  { id: "4", titleKey: "student.todo.items.report", courseKey: "student.courses.chem", dueLabelKey: "student.todo.due.submitted", status: "submitted" },
  { id: "5", titleKey: "student.todo.items.reflection", courseKey: "student.courses.psych", dueLabelKey: "student.todo.due.revise", status: "needsRevision" },
  { id: "6", titleKey: "student.todo.items.preReading", courseKey: "student.courses.chem", dueLabelKey: "student.todo.due.completed", status: "completed" },
];

const STATUS_META: Record<Status, { color: string; icon: typeof Inbox }> = {
  open: { color: "bg-primary/10 text-primary border-primary/30", icon: Inbox },
  overdue: { color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle },
  submitted: { color: "bg-secondary/10 text-secondary border-secondary/30", icon: FileText },
  needsRevision: { color: "bg-streak/10 text-streak border-streak/30", icon: RotateCcw },
  completed: { color: "bg-muted text-foreground/50 border-border", icon: CheckCircle2 },
};

const FILTERS: Status[] = ["open", "overdue", "submitted", "needsRevision", "completed"];

export function MyTodo() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Status>("open");
  const filtered = todos.filter((todo) => todo.status === active);

  return (
    <section className="space-y-4 animate-bounce-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">{t("student.todo.title")}</h3>
        <span className="text-xs font-bold text-foreground/40">
          {t("student.todo.countLabel", { count: filtered.length })}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const meta = STATUS_META[f];
          const Icon = meta.icon;
          const isActive = active === f;
          const count = todos.filter((tt) => tt.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black uppercase tracking-wider border-2 transition-all ${
                isActive ? meta.color + " scale-105" : "bg-card border-border text-foreground/50 hover:border-foreground/20"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
              {t(`student.todo.filter.${f}`)}
              <span className="font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border-2 border-border rounded-[28px] p-3 sm:p-4 chunky-shadow space-y-2 min-h-[200px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-foreground/40 text-sm font-bold">
            {t("student.todo.empty")}
          </div>
        ) : (
          filtered.map((todo) => {
            const meta = STATUS_META[todo.status];
            const Icon = meta.icon;
            return (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div className={`size-10 rounded-xl grid place-items-center border-2 ${meta.color}`}>
                  <Icon className="size-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{t(todo.titleKey)}</p>
                  <p className="text-xs font-medium text-foreground/50 truncate">{t(todo.courseKey)}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40 shrink-0">
                  {t(todo.dueLabelKey)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
