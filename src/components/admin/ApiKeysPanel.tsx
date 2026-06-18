import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Key, Copy, Plus, Check } from "lucide-react";

const KEYS = [
  { id: 1, labelKey: "production", token: "edubot_live_a4f2…9c1b", created: "2026-03-12" },
  { id: 2, labelKey: "staging", token: "edubot_test_71de…40a2", created: "2026-05-02" },
  { id: 3, labelKey: "mobile", token: "edubot_live_8b3c…ee71", created: "2026-05-28" },
];

function formatCreatedDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function ApiKeysPanel() {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState<number | null>(null);
  const locale = i18n.resolvedLanguage || i18n.language;
  const createdDates = useMemo(
    () => Object.fromEntries(KEYS.map((key) => [key.id, formatCreatedDate(key.created, locale)])),
    [locale],
  );

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
        {KEYS.map((key) => (
          <li key={key.id} className="flex items-center gap-3 p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{t(`admin.apiKeys.labels.${key.labelKey}`, { defaultValue: key.labelKey })}</div>
              <div className="font-mono text-[11px] text-foreground/55 truncate">{key.token}</div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-foreground/50">{createdDates[key.id]}</span>
            <button
              onClick={() => copy(key.id, key.token)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
            >
              {copied === key.id ? <Check className="size-3" strokeWidth={3} /> : <Copy className="size-3" strokeWidth={3} />}
              {copied === key.id ? t("admin.apiKeys.copied") : t("admin.apiKeys.copy")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
