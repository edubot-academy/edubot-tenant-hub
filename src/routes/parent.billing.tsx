import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Receipt, TrendingDown, AlertCircle } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";
import {
  useParentBillingSummary,
  useParentBillingInvoices,
  type ParentBillingInvoice,
} from "@/lib/parent-billing-api";

export const Route = createFileRoute("/parent/billing")({
  head: () => ({ meta: [{ title: "QuestLMS — Tuition" }] }),
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
  const summaryQuery = useParentBillingSummary();
  const invoicesQuery = useParentBillingInvoices();

  const summary = summaryQuery.data;
  const invoices = invoicesQuery.data ?? [];
  const currency = summary?.currency ?? "USD";

  const fmt = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);

  return (
    <DashboardShell>
      <TopBar
        title="Tuition"
        subtitle="Payments and invoices for your children."
        showStreak={false}
      />

      <div className="mb-6 grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-7 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground chunky-shadow">
          {summaryQuery.isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-white/20" />
          ) : summaryQuery.isError ? (
            <div className="flex items-center gap-2 text-sm font-medium opacity-80">
              <AlertCircle className="size-4" /> Unable to load billing summary.
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">
                {summary?.nextDueAmount ? "Next payment" : "Outstanding balance"}
              </p>
              <p className="mt-2 text-4xl font-black font-mono">
                {summary?.nextDueAmount
                  ? fmt(summary.nextDueAmount)
                  : fmt(summary?.totalOpen ?? 0)}
              </p>
              {summary?.nextDueDate ? (
                <p className="mt-1 text-sm font-medium opacity-90">
                  Due{" "}
                  {new Date(summary.nextDueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              ) : null}
            </>
          )}
        </section>

        <section className="col-span-12 lg:col-span-5 rounded-3xl border-2 border-border bg-card p-6 chunky-shadow space-y-3">
          <h3 className="text-base font-black">Summary</h3>
          {summaryQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground/70">
                  <CreditCard className="size-4" /> Total paid
                </span>
                <span className="font-mono font-black">{fmt(summary?.totalPaid ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground/70">
                  <TrendingDown className="size-4" /> Outstanding
                </span>
                <span className="font-mono font-black text-destructive">
                  {fmt(summary?.totalOpen ?? 0)}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border-2 border-border bg-card chunky-shadow overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b-2 border-border">
          <Receipt className="size-4 text-primary" />
          <h3 className="font-black">Payment history</h3>
        </div>

        {invoicesQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto mb-3 size-10 text-foreground/30" />
            <p className="font-black">No payment records yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} currency={currency} />
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}

function InvoiceRow({
  invoice,
  currency,
}: {
  invoice: ParentBillingInvoice;
  currency: string;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

  const statusClass =
    invoice.status === "paid"
      ? "bg-emerald-500/15 text-emerald-600"
      : invoice.status === "failed"
        ? "bg-destructive/15 text-destructive"
        : "bg-accent/20 text-accent-foreground";

  return (
    <li className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <p className="font-black truncate">
          {invoice.description ?? `Invoice #${invoice.id}`}
        </p>
        <p className="text-xs font-medium text-foreground/55">
          {invoice.studentName ? `${invoice.studentName} · ` : ""}
          {new Date(invoice.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <span className="shrink-0 font-mono font-black">{fmt(invoice.amount)}</span>
      <span
        className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass}`}
      >
        {invoice.status}
      </span>
    </li>
  );
}

function PrototypeBillingPage() {
  const prototypeInvoices = [
    { id: "INV-0042", period: "Jun 2026", amount: "$240.00", status: "open" as const, date: "Jun 15" },
    { id: "INV-0041", period: "May 2026", amount: "$240.00", status: "paid" as const, date: "May 15" },
    { id: "INV-0040", period: "Apr 2026", amount: "$240.00", status: "paid" as const, date: "Apr 15" },
  ];

  return (
    <DashboardShell>
      <TopBar title="Tuition" subtitle="Payments and invoices for your children." showStreak={false} />
      <div className="mb-8 grid grid-cols-12 gap-6">
        <section className="col-span-12 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground chunky-shadow lg:col-span-7">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Next payment</p>
          <p className="mt-2 text-4xl font-black font-mono">$240.00</p>
          <p className="mt-1 text-sm font-medium opacity-90">Due Jun 15 · Autopay enabled</p>
          <div className="mt-5 flex gap-2">
            <button className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25">Pay now</button>
            <button className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25">Manage autopay</button>
          </div>
        </section>
        <section className="col-span-12 space-y-3 rounded-3xl border-2 border-border bg-card p-6 chunky-shadow lg:col-span-5">
          <h3 className="text-lg font-black">Payment method</h3>
          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <p className="font-mono font-bold">•••• 4242</p>
            <p className="mt-1 text-xs font-medium text-foreground/55">Visa · expires 09/28</p>
          </div>
        </section>
      </div>
      <section className="rounded-3xl border-2 border-border bg-card p-3 chunky-shadow sm:p-5">
        <h3 className="mb-3 px-2 text-xl font-black">Payment history</h3>
        <ul className="divide-y divide-border">
          {prototypeInvoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center gap-4 rounded-2xl p-3 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{invoice.id}</p>
                <p className="text-xs font-medium text-foreground/55">{invoice.period} · {invoice.date}</p>
              </div>
              <span className="shrink-0 font-mono text-base font-black">{invoice.amount}</span>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-600" : "bg-accent/20 text-accent-foreground"}`}>
                {invoice.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
