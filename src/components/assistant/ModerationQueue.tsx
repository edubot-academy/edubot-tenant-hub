import { useTranslation } from "react-i18next";
import { Flag, Check, X } from "lucide-react";

const reports = [
  { id: 1, key: "r1", reason: "spam", thread: "th1" },
  { id: 2, key: "r2", reason: "offTopic", thread: "th2" },
  { id: 3, key: "r3", reason: "harassment", thread: "th3" },
];

const reasonStyles: Record<string, string> = {
  spam: "bg-muted text-foreground/70",
  offTopic: "bg-brand-accent-soft text-accent",
  harassment: "bg-destructive/15 text-destructive",
};

export function ModerationQueue() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Flag className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {t("assistant.mod.title")}
        </h3>
        <span className="text-xs font-mono text-foreground/50 ml-auto">{reports.length}</span>
      </div>

      <ul className="divide-y divide-border/60">
        {reports.map((r) => (
          <li key={r.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${reasonStyles[r.reason]}`}
              >
                {t(`assistant.mod.reason.${r.reason}`)}
              </span>
              <span className="text-[11px] font-mono text-foreground/50">
                {t(`assistant.mod.threads.${r.thread}`)}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-snug line-clamp-2">
              {t(`assistant.mod.items.${r.key}`)}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-md bg-brand-primary-soft text-primary text-xs font-bold cursor-pointer hover:bg-brand-primary-emphasis">
                <Check className="size-3.5" strokeWidth={3} />
                {t("assistant.mod.approve")}
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-bold cursor-pointer hover:bg-destructive/15">
                <X className="size-3.5" strokeWidth={3} />
                {t("assistant.mod.remove")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
