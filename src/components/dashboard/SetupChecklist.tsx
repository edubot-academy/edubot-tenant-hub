import { Check, ArrowRight, Sparkles } from "lucide-react";

type Item = { key: string; label: string; detail: string; complete: boolean };

const items: Item[] = [
  { key: "profile", label: "Tenant profile", detail: "Name, contact, timezone", complete: true },
  { key: "branding", label: "Branding", detail: "Logo & colors uploaded", complete: true },
  { key: "instructors", label: "Invite instructors", detail: "4 instructors active", complete: true },
  { key: "course", label: "Create first course", detail: "2 courses live", complete: true },
  { key: "group", label: "Set up a group", detail: "Cohort & enrollment", complete: false },
  { key: "sessions", label: "Schedule sessions", detail: "Live classroom calendar", complete: false },
  { key: "certificates", label: "Configure certificates", detail: "Template & signatures", complete: false },
];

export function SetupChecklist() {
  const done = items.filter((i) => i.complete).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div
      className="bg-card border-2 border-border rounded-[32px] p-6 chunky-shadow animate-bounce-in"
      style={{ animationDelay: "150ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-accent/20 grid place-items-center">
            <Sparkles className="size-5 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Tenant Setup</h3>
            <p className="text-xs font-bold text-foreground/50">
              {done} of {items.length} complete · {pct}%
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full">
          Keep going
        </span>
      </div>

      <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 mb-5">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.slice(0, 5).map((i) => (
          <li
            key={i.key}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors ${
              i.complete
                ? "border-transparent bg-muted/50"
                : "border-border bg-card hover:border-primary/40 cursor-pointer"
            }`}
          >
            <span
              className={`size-6 rounded-lg grid place-items-center shrink-0 ${
                i.complete ? "bg-streak text-white" : "bg-muted border-2 border-border"
              }`}
            >
              {i.complete && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold truncate ${
                  i.complete ? "text-foreground/40 line-through" : "text-foreground"
                }`}
              >
                {i.label}
              </p>
              <p className="text-[11px] font-medium text-foreground/40 truncate">{i.detail}</p>
            </div>
            {!i.complete && <ArrowRight className="size-4 text-foreground/30" strokeWidth={2.5} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
