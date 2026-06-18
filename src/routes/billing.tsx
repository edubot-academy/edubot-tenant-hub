import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CreditCard, FileText, Sparkles, Users, BookOpen, Bot } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { BillingUsage } from "@/components/admin/BillingUsage";
import { PaymentMethodCard } from "@/components/admin/PaymentMethodCard";
import { PlanComparison } from "@/components/admin/PlanComparison";
import { InvoicesList, type Invoice } from "@/components/admin/InvoicesList";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useCompanyBillingInvoices,
  useCompanyBillingPaymentMethod,
  useCompanyBillingSubscription,
  useCompanyBillingUsage,
  useUpdateCompanyBillingPaymentMethod,
  useUpdateCompanyBillingPlan,
} from "@/lib/company-admin/company-billing-api";
import type { TenantPlan } from "@/hooks/use-tenant";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.billing")}` }] }),
  component: BillingPage,
});

const INVOICES: Invoice[] = [
  { id: "INV-2026-0006", date: "Jun 1, 2026", period: "May 2026", amount: 1249, status: "open" },
  { id: "INV-2026-0005", date: "May 1, 2026", period: "Apr 2026", amount: 1249, status: "paid" },
  { id: "INV-2026-0004", date: "Apr 1, 2026", period: "Mar 2026", amount: 1180, status: "paid" },
  { id: "INV-2026-0003", date: "Mar 1, 2026", period: "Feb 2026", amount: 1180, status: "paid" },
  { id: "INV-2026-0002", date: "Feb 1, 2026", period: "Jan 2026", amount: 980, status: "failed" },
  { id: "INV-2026-0001", date: "Jan 1, 2026", period: "Dec 2025", amount: 980, status: "paid" },
];

function BillingPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const aiEnabled = Boolean(context.featureFlags.ai);
  const { data: subscription, isLoading: subscriptionLoading, isError: subscriptionError } = useCompanyBillingSubscription();
  const { data: usage, isLoading: usageLoading, isError: usageError } = useCompanyBillingUsage();
  const { data: invoices, isLoading: invoicesLoading, isError: invoicesError } = useCompanyBillingInvoices();
  const { data: paymentMethod, isLoading: paymentLoading, isError: paymentError } = useCompanyBillingPaymentMethod();
  const updatePlan = useUpdateCompanyBillingPlan();
  const updatePaymentMethod = useUpdateCompanyBillingPaymentMethod();

  if (backendEnabled) {
    const loading = subscriptionLoading || usageLoading || invoicesLoading || paymentLoading;
    const hasError = subscriptionError || usageError || invoicesError || paymentError;
    const primaryEmail = subscription?.subscription.billingEmail ?? "billing@pending.local";
    const backendInvoices: Invoice[] = (invoices?.items ?? []).map((item) => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      status: item.status,
      period: item.period,
    }));
    const handleChoosePlan = async (plan: TenantPlan) => {
      try {
        await updatePlan.mutateAsync({ plan });
        toast.success(t("billingPage.plan.saved"));
      } catch (error) {
        toast.error(t("billingPage.plan.saveFailed"));
        throw error;
      }
    };
    const handleSavePaymentMethod = async (input: {
      available: boolean;
      brand: string | null;
      last4: string | null;
      expiryMonth: number | null;
      expiryYear: number | null;
      cardholderName: string | null;
      billingEmail: string | null;
    }) => {
      try {
        await updatePaymentMethod.mutateAsync(input);
        toast.success(t("billingPage.payment.saved"));
      } catch (error) {
        toast.error(t("billingPage.payment.saveFailed"));
        throw error;
      }
    };

    return (
      <DashboardShell>
        <TopBar />
        <section className="grid grid-cols-12 gap-4">
          {loading && (
            <div className="col-span-12 rounded-2xl border border-border bg-card p-4 text-sm text-foreground/60">
              {t("billingPage.state.loading")}
            </div>
          )}

          {hasError && (
            <div className="col-span-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {t("billingPage.state.error")}
            </div>
          )}

          {!loading && !hasError && subscription && usage && invoices && (
            <>
              <section className="col-span-12 lg:col-span-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border p-4">
                  <CreditCard className="size-4 text-foreground/60" strokeWidth={2.5} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.title")}</h3>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    {subscription.subscription.plan ?? t("billingPage.summary.noPlan")}
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BillingStat icon={Users} label={t("admin.billing.seats")} value={usage.usage.seats.used.toLocaleString()} hint={t("billingPage.summary.studentSeats", { limit: usage.usage.seats.limit ?? t("billingPage.summary.unavailable") })} />
                    <BillingStat icon={BookOpen} label={t("billingPage.usage.courses")} value={usage.usage.courses.used.toLocaleString()} hint={t("billingPage.summary.activeCourses")} />
                    {aiEnabled && <BillingStat icon={Bot} label={t("admin.billing.aiCredits")} value={usage.usage.aiCredits.used === null ? t("billingPage.summary.unavailable") : usage.usage.aiCredits.used.toLocaleString()} hint={t("billingPage.summary.aiCredits", { limit: usage.usage.aiCredits.limit ?? t("billingPage.summary.unavailable") })} />}
                    <BillingStat icon={Sparkles} label={t("billingPage.usage.billingStatus")} value={subscription.subscription.billingStatus ?? subscription.subscription.tenantStatus ?? t("billingPage.summary.unknown")} hint={t("billingPage.summary.workspaceStatus")} />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      {t("admin.billing.payment.billedTo")}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{primaryEmail}</div>
                    <div className="mt-2 text-xs text-foreground/60">
                      {t("billingPage.summary.workspaceHost", { host: subscription.tenant.host ?? t("billingPage.summary.unavailable") })}
                    </div>
                  </div>
                </div>
              </section>

              <PlanComparison currentPlan={(subscription.subscription.plan as TenantPlan | null) ?? undefined} onChoosePlan={handleChoosePlan} isSubmitting={updatePlan.isPending} />
              <PaymentMethodCard available={Boolean(paymentMethod?.paymentMethod.available)} brand={paymentMethod?.paymentMethod.brand ?? null} last4={paymentMethod?.paymentMethod.last4 ?? null} expiryMonth={paymentMethod?.paymentMethod.expiryMonth ?? null} expiryYear={paymentMethod?.paymentMethod.expiryYear ?? null} cardholderName={paymentMethod?.paymentMethod.cardholderName ?? null} billingEmail={paymentMethod?.paymentMethod.billingEmail ?? primaryEmail} onSave={handleSavePaymentMethod} isSaving={updatePaymentMethod.isPending} />

              <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border p-4">
                  <FileText className="size-4 text-foreground/60" strokeWidth={2.5} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.invoices.title")}</h3>
                </div>
                {backendInvoices.length > 0 ? (
                  <InvoicesList invoices={backendInvoices} />
                ) : (
                  <div className="p-4 text-sm text-foreground/60">
                    {t("billingPage.invoices.unavailable")}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <TopBar />
      <section className="grid grid-cols-12 gap-4">
        <BillingUsage />
        <PaymentMethodCard />
        <PlanComparison />
        <InvoicesList invoices={INVOICES} />
      </section>
    </DashboardShell>
  );
}

function BillingStat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/55">
        <Icon className="size-3.5 text-foreground/60" strokeWidth={2.5} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs text-foreground/60">{hint}</div>
    </div>
  );
}
