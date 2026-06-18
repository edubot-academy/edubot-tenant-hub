import { useTranslation } from "react-i18next";
import { Plug, Check } from "lucide-react";

const integrations = [
  { id: 1, key: "zoom", connected: true },
  { id: 2, key: "google", connected: true },
  { id: 3, key: "slack", connected: false },
  { id: 4, key: "stripe", connected: false },
];

export function IntegrationHub() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Plug className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.integrations.title")}</h3>
      </div>
      <ul className="divide-y divide-border/60">
        {integrations.map((i) => (
          <li key={i.id} className="flex items-center gap-3 p-3">
            <div className="size-9 rounded-lg bg-muted grid place-items-center font-black text-xs">
              {t(`admin.integrations.short.${i.key}`)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{t(`admin.integrations.names.${i.key}`)}</div>
              <div className="text-xs text-foreground/55 font-medium">
                {t(`admin.integrations.desc.${i.key}`)}
              </div>
            </div>
            {i.connected ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-primary-soft text-brand-primary-text text-[10px] font-bold uppercase tracking-wider">
                <Check className="size-3" strokeWidth={3} />
                {t("admin.integrations.connected")}
              </span>
            ) : (
              <button className="px-2.5 py-1 rounded-md border border-border text-xs font-bold hover:bg-muted cursor-pointer">
                {t("admin.integrations.connect")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
