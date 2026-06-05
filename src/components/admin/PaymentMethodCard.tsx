import { useTranslation } from "react-i18next";
import { CreditCard, Pencil } from "lucide-react";

export function PaymentMethodCard() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <CreditCard className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.payment.title")}</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="relative rounded-xl bg-gradient-to-br from-foreground to-foreground/70 text-background p-4 aspect-[1.586/1] flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Visa</span>
            <div className="size-6 rounded bg-streak/80" />
          </div>
          <div>
            <div className="font-mono text-base tracking-[0.2em]">•••• •••• •••• 4242</div>
            <div className="flex items-center justify-between mt-2 text-[10px] font-mono opacity-80">
              <span>ACME ACADEMY</span>
              <span>12/27</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {t("admin.billing.payment.billedTo")}
            </div>
            <div className="text-xs font-semibold mt-0.5">billing@acme.kg</div>
          </div>
          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs font-bold hover:bg-muted cursor-pointer">
            <Pencil className="size-3" strokeWidth={3} />
            {t("admin.billing.payment.update")}
          </button>
        </div>
      </div>
    </section>
  );
}
