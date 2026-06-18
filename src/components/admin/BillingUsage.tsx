import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, ArrowUpRight } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { useAppContext } from "@/lib/app-context";

function UsageBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = pct > 85 ? "bg-destructive" : pct > 65 ? "bg-streak" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">{label}</span>
        <span className="font-mono text-xs font-semibold">
          {used.toLocaleString()}{unit ?? ""} / {limit.toLocaleString()}{unit ?? ""}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BillingUsage() {
  const { t, i18n } = useTranslation();
  const tenant = useTenant();
  const { context } = useAppContext();
  const aiEnabled = Boolean(context.featureFlags.ai);
  const locale = i18n.resolvedLanguage || i18n.language;
  const dueDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(Date.UTC(2026, 6, 1))),
    [locale],
  );

  return (
    <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <CreditCard className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.title")}</h3>
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-primary-soft text-brand-primary-text text-[10px] font-black uppercase tracking-wider">
          {t(`tenant.plan.${tenant.plan}`)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {t("admin.billing.nextInvoice")}
            </div>
            <div className="text-2xl font-black font-mono mt-0.5">$1,249</div>
            <div className="text-[11px] text-foreground/55 font-medium">{t("admin.billing.dueOn", { date: dueDate })}</div>
          </div>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-bold hover:bg-muted cursor-pointer">
            {t("admin.billing.upgrade")}
            <ArrowUpRight className="size-3" strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <UsageBar label={t("admin.billing.seats")} used={tenant.seats.used} limit={tenant.seats.limit} />
          <UsageBar label={t("admin.billing.storage")} used={tenant.storageGb.used} limit={tenant.storageGb.limit} unit=" GB" />
          {aiEnabled && <UsageBar label={t("admin.billing.aiCredits")} used={tenant.aiCredits.used} limit={tenant.aiCredits.limit} />}
        </div>
      </div>
    </section>
  );
}
