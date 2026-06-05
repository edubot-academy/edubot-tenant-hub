import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Key, Copy, Plus, Check } from "lucide-react";

const KEYS = [
  { id: 1, label: "Production", token: "qlms_live_a4f2…9c1b", created: "2026-03-12" },
  { id: 2, label: "Staging", token: "qlms_test_71de…40a2", created: "2026-05-02" },
  { id: 3, label: "Mobile App", token: "qlms_live_8b3c…ee71", created: "2026-05-28" },
];

export function ApiKeysPanel() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (id: number, token: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Key className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.apiKeys.title")}</h3>
        <button className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer">
          <Plus className="size-3" strokeWidth={3} />
          {t("admin.apiKeys.create")}
        </button>
      </div>

      <ul className="divide-y divide-border/60">
        {KEYS.map((k) => (
          <li key={k.id} className="flex items-center gap-3 p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{k.label}</div>
              <div className="font-mono text-[11px] text-foreground/55 truncate">{k.token}</div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-foreground/50">{k.created}</span>
            <button
              onClick={() => copy(k.id, k.token)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
            >
              {copied === k.id ? <Check className="size-3" strokeWidth={3} /> : <Copy className="size-3" strokeWidth={3} />}
              {copied === k.id ? t("admin.apiKeys.copied") : t("admin.apiKeys.copy")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
