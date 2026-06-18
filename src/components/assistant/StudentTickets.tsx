import { useTranslation } from "react-i18next";
import { LifeBuoy } from "lucide-react";

const tickets = [
  { id: 1, key: "t1", initials: "AM", priority: "high", age: "12m" },
  { id: 2, key: "t2", initials: "BT", priority: "med", age: "1h" },
  { id: 3, key: "t3", initials: "DK", priority: "low", age: "3h" },
  { id: 4, key: "t4", initials: "EA", priority: "med", age: "5h" },
];

const priorityStyles: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  med: "bg-accent text-accent-foreground",
  low: "bg-muted text-foreground/70",
};

export function StudentTickets() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <LifeBuoy className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {t("assistant.tickets.title")}
        </h3>
        <span className="text-xs font-mono text-foreground/50 ml-auto">{tickets.length} open</span>
      </div>

      <ul className="divide-y divide-border/60">
        {tickets.map((tk) => (
          <li key={tk.id} className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-pointer">
            <span
              className={`size-1.5 rounded-full ${priorityStyles[tk.priority]} shrink-0`}
              aria-hidden
            />
            <div className="size-8 rounded-full bg-brand-secondary-soft text-secondary grid place-items-center font-bold text-xs shrink-0">
              {tk.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {t(`assistant.tickets.items.${tk.key}`)}
              </div>
              <div className="text-[11px] text-foreground/55 font-medium font-mono">
                {t(`assistant.tickets.priority.${tk.priority}`)} · {tk.age}
              </div>
            </div>
            <button className="text-xs font-bold text-primary hover:underline cursor-pointer shrink-0">
              {t("assistant.tickets.reply")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
