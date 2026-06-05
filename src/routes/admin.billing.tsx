import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { BillingUsage } from "@/components/admin/BillingUsage";
import { PaymentMethodCard } from "@/components/admin/PaymentMethodCard";
import { PlanComparison } from "@/components/admin/PlanComparison";
import { InvoicesList, type Invoice } from "@/components/admin/InvoicesList";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "QuestLMS — Billing" }] }),
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
