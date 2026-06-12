import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Receipt, TrendingDown, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useParentBillingSummary,
  useParentBillingInvoices,
  type ParentBillingInvoice,
} from "@/lib/parent-billing-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/parent/billing")({
  head: () => ({ meta: [{ title: i18n.t("parentBilling.meta.title") }] }),
  component: ParentBillingPage,
});

function ParentBillingPage() {
  const { context } = useAppContext();

  if (context.mode !== "backend") {
    return <PrototypeBillingPage />;
  }

  return <BackendBillingPage />;
}

function BackendBillingPage() {
  const { t, i18n: i18next } = useTranslation();
  const summaryQuery = useParentBillingSummary();
  const invoicesQuery = useParentBillingInvoices();

  const summary = summaryQuery.data;
  const invoices = invoicesQuery.data ?? [];
  const currency = summary?.currency ?? "KGS";

  const fmt = (amount: number) => new Intl.NumberFormat(i18next.language, { style: "currency", currency }).format(amount);
  const formatDate = (value: string) => new Intl.DateTimeFormat(i18next.language, { month: "short", day: "numeric" }).format(new Date(value));

  return (
    <DashboardShell>
      <TopBar title={t("parentBilling.topbar.title")} subtitle={t("parentBilling.topbar.subtitle")} showStreak={false} />

      <div className="mb-6 grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-7 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground chunky-shadow">
          {summaryQuery.isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-white/20" />
          ) : summaryQuery.isError ? (
            <div className="flex items-center gap-2 text-sm font-medium opacity-80">
              <AlertCircle className="size-4" /> {t("parentBilling.state.summaryError")}
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">
                {summary?.nextDueAmount ? t("parentBilling.summary.nextPayment") : t("parentBilling.summary.outstandingBalance")}
              </p>
              <p className="mt-2 text-4xl font-black font-mono">
                {summary?.nextDueAmount ? fmt(summary.nextDueAmount) : fmt(summary?.totalOpen ?? 0)}
              </p>
              {summary?.nextDueDate ? (
                <p className="mt-1 text-sm font-medium opacity-90">
                  {t("parentBilling.summary.due", { date: formatDate(summary.nextDueDate) })}
                </p>
              ) : null}
            </>
          )}
        </section>

        <section className="col-span-12 lg:col-span-5 rounded-3xl border-2 border-border bg-card p-6 chunky-shadow space-y-3">
          <h3 className="text-base font-black">{t("parentBilling.summary.title")}</h3>
          {summaryQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground/70">
                  <CreditCard className="size-4" /> {t("parentBilling.summary.totalPaid")}
                </span>
                <span className="font-mono font-black">{fmt(summary?.totalPaid ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground/70">
                  <TrendingDown className="size-4" /> {t("parentBilling.summary.outstanding")}
                </span>
                <span className="font-mono font-black text-destructive">{fmt(summary?.totalOpen ?? 0)}</span>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b-2 border-border">
          <Receipt className="size-4 text-primary" />
          <h3 className="font-black">{t("parentBilling.history.title")}</h3>
        </div>

        {invoicesQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto mb-3 size-10 text-foreground/30" />
            <p className="font-black">{t("parentBilling.history.empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} currency={currency} locale={i18next.language} />)}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}

function InvoiceRow({ invoice, currency, locale }: { invoice: ParentBillingInvoice; currency: string; locale: string }) {
  const { t } = useTranslation();
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
  const statusClass = invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-600" : invoice.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-accent/20 text-accent-foreground";

  return (
    <li className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <p className="font-black truncate">{invoice.description ?? t("parentBilling.history.invoiceFallback", { id: invoice.id })}</p>
        <p className="text-xs font-medium text-foreground/55">
          {invoice.studentName ? `${invoice.studentName} · ` : ""}
          {new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(invoice.createdAt))}
        </p>
      </div>
      <span className="shrink-0 font-mono font-black">{fmt(invoice.amount)}</span>
      <span className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass}`}>
        {t(`parentBilling.status.${invoice.status}`, { defaultValue: invoice.status })}
      </span>
    </li>
  );
}

function PrototypeBillingPage() {
  const { t } = useTranslation();
  return (
    <DashboardShell>
      <TopBar title={t("parentBilling.topbar.title")} subtitle={t("parentBilling.topbar.subtitle")} showStreak={false} />
      <section className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
        <p className="font-black">{t("parentBilling.history.empty")}</p>
      </section>
    </DashboardShell>
  );
}
