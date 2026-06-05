import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, ToggleLeft, ToggleRight } from "lucide-react";

const initialFlags = [
  { id: "aiTutor", labelKey: "owner.settings.aiTutor", enabled: true },
  { id: "quizArena", labelKey: "owner.settings.quizArena", enabled: true },
  { id: "streaks", labelKey: "owner.settings.streaks", enabled: true },
  { id: "marketplace", labelKey: "owner.settings.marketplace", enabled: false },
  { id: "sso", labelKey: "owner.settings.sso", enabled: true },
  { id: "parentPortal", labelKey: "owner.settings.parentPortal", enabled: true },
];

export function PlatformSettings() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState(initialFlags);

  const toggle = (id: string) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  return (
    <section className="col-span-12 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("owner.settings.title")}</h3>
        <Settings className="size-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {flags.map((flag) => {
          const Icon = flag.enabled ? ToggleRight : ToggleLeft;
          return (
            <button
              key={flag.id}
              type="button"
              onClick={() => toggle(flag.id)}
              className={`flex items-center justify-between rounded-xl p-3 border transition-colors text-left ${
                flag.enabled
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-sm font-semibold">{t(flag.labelKey)}</span>
              <Icon className={`size-5 ${flag.enabled ? "text-primary" : "text-muted-foreground"}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
