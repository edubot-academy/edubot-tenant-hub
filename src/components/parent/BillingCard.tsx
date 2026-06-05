import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2 } from "lucide-react";

export function BillingCard() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-4 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-accent/20 text-accent-foreground grid place-items-center">
          <CreditCard className="size-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black flex-1">{t("parent.billing.title")}</h3>
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-foreground/55">
        {t("parent.billing.nextDue")}
      </div>
      <div className="text-3xl font-black tabular-nums mt-1">12,000 c</div>
      <div className="text-sm text-foreground/60 font-semibold">{t("parent.billing.dueOn")}</div>

      <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold">
        <CheckCircle2 className="size-4" strokeWidth={2.5} />
        {t("parent.billing.autopay")}
      </div>

      <button className="mt-auto pt-4 text-sm font-bold text-primary text-left hover:underline cursor-pointer">
        {t("parent.billing.history")} →
      </button>
    </section>
  );
}
