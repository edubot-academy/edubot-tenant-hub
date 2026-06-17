import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";

const messages = [
  { id: 1, from: "Prof. Aris", key: "m1", when: "1h", initials: "PA" },
  { id: 2, from: "Ms. Saltanat", key: "m2", when: "1d", initials: "MS" },
  { id: 3, from: "School Admin", key: "m3", when: "3d", initials: "SA" },
];

export function ParentMessages() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-brand-secondary-soft text-secondary grid place-items-center">
          <MessageSquare className="size-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black flex-1">{t("parent.messages.title")}</h3>
        <button className="text-xs font-bold text-primary hover:underline cursor-pointer">
          {t("parent.messages.viewAll")}
        </button>
      </div>

      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="size-10 rounded-full bg-brand-primary-emphasis text-primary grid place-items-center font-black text-xs shrink-0">
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-bold text-sm truncate">{m.from}</div>
                <div className="text-xs text-foreground/50 font-medium shrink-0">{m.when}</div>
              </div>
              <p className="text-sm text-foreground/70 font-medium truncate mt-0.5">
                {t(`parent.messages.items.${m.key}`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
