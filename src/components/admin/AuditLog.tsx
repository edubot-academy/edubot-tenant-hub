import { useTranslation } from "react-i18next";
import { ScrollText } from "lucide-react";

const logs = [
  { id: 1, actor: "Aris B.", actionKey: "a1", target: "course #18", when: "2m" },
  { id: 2, actor: "Marat K.", actionKey: "a2", target: "user dilnoza@…", when: "12m" },
  { id: 3, actor: "System", actionKey: "a3", target: "backup", when: "1h" },
  { id: 4, actor: "Saltanat T.", actionKey: "a4", target: "quiz #82", when: "3h" },
  { id: 5, actor: "Aris B.", actionKey: "a5", target: "settings.branding", when: "1d" },
];

export function AuditLog() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <ScrollText className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.audit.title")}</h3>
        <span className="text-xs font-mono text-foreground/50 ml-auto">{t("admin.audit.last24")}</span>
      </div>
      <ul className="divide-y divide-border/60">
        {logs.map((l) => (
          <li key={l.id} className="flex items-center gap-3 p-3 text-sm font-mono hover:bg-muted/40">
            <span className="text-foreground/40 text-xs w-10 shrink-0">{l.when}</span>
            <span className="font-bold shrink-0">{l.actor}</span>
            <span className="text-foreground/60">{t(`admin.audit.actions.${l.actionKey}`)}</span>
            <span className="text-foreground/40 truncate">{l.target}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
