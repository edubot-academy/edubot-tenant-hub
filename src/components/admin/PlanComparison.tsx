import { useTranslation } from "react-i18next";
import { Check, Sparkles } from "lucide-react";
import { useTenant, type TenantPlan } from "@/hooks/use-tenant";

interface Plan {
  id: TenantPlan;
  price: number;
  seats: number;
  storage: number;
  ai: number;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  { id: "starter", price: 49, seats: 50, storage: 20, ai: 10000 },
  { id: "growth", price: 249, seats: 500, storage: 100, ai: 50000, highlight: true },
  { id: "scale", price: 899, seats: 2500, storage: 500, ai: 200000 },
  { id: "enterprise", price: 0, seats: 10000, storage: 2000, ai: 1000000 },
];

export function PlanComparison() {
  const { t } = useTranslation();
  const tenant = useTenant();

  return (
    <section className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Sparkles className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.plans.title")}</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {PLANS.map((plan) => {
          const current = plan.id === tenant.plan;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-3 flex flex-col ${
                plan.highlight ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {current && (
                <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded bg-foreground text-background text-[9px] font-black uppercase tracking-widest">
                  {t("admin.billing.plans.current")}
                </span>
              )}
              <div className="text-sm font-black uppercase tracking-wider">
                {t(`tenant.plan.${plan.id}`)}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.price > 0 ? (
                  <>
                    <span className="text-2xl font-black font-mono">${plan.price}</span>
                    <span className="text-[10px] font-bold text-foreground/55">
                      {t("admin.billing.plans.perMonth")}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-black">{t("admin.billing.plans.custom")}</span>
                )}
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-foreground/75 flex-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                  {t("admin.billing.plans.seats", { n: plan.seats.toLocaleString() })}
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                  {t("admin.billing.plans.storage", { n: plan.storage })}
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                  {t("admin.billing.plans.ai", { n: plan.ai.toLocaleString() })}
                </li>
              </ul>
              <button
                disabled={current}
                className={`mt-3 w-full px-2 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                  current
                    ? "bg-muted text-foreground/40 cursor-not-allowed"
                    : plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                }`}
              >
                {current
                  ? t("admin.billing.plans.currentPlan")
                  : plan.price === 0
                    ? t("admin.billing.plans.contact")
                    : t("admin.billing.plans.choose")}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
