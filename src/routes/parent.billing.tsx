import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, FileText, Info, Receipt } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAppContext } from "@/lib/app-context";

export const Route = createFileRoute("/parent/billing")({
  head: () => ({ meta: [{ title: "QuestLMS — Tuition" }] }),
  component: ParentBillingPage,
});

const prototypeInvoices = [
  { id: "INV-0042", period: "Jun 2026", amount: "$240.00", status: "open" as const, date: "Jun 15" },
  { id: "INV-0041", period: "May 2026", amount: "$240.00", status: "paid" as const, date: "May 15" },
  { id: "INV-0040", period: "Apr 2026", amount: "$240.00", status: "paid" as const, date: "Apr 15" },
  { id: "INV-0039", period: "Mar 2026", amount: "$240.00", status: "paid" as const, date: "Mar 15" },
];

function ParentBillingPage() {
  const { context } = useAppContext();

  return (
    <DashboardShell>
      <TopBar title="Tuition" subtitle="Payments and invoices for your children." showStreak={false} />

      {context.mode !== "backend" ? (
        <>
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
              <button className="text-xs font-bold text-primary hover:underline">Update payment method</button>
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
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-600" : "bg-accent/20 text-accent-foreground"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary"><Receipt className="size-5" /></span>
              <div>
                <h3 className="text-lg font-black">Parent billing is not wired yet</h3>
                <p className="mt-2 text-sm font-medium text-foreground/65">
                  Backend mode already supports tenant subscription billing for company admins, but that is the wrong billing domain for parents. This screen needs learner or guardian tuition contracts, not company workspace subscription data.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/30 p-4 text-sm font-medium text-foreground/70">
              Until a parent-facing tuition ledger exists, the tenant frontend should not guess balances, invoices, or payment methods from company billing state.
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
            <div className="flex items-center gap-2 text-foreground/55">
              <Info className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Required backend scope</span>
            </div>
            <div className="mt-4 space-y-3">
              <Requirement icon={<FileText className="size-4" />} title="Invoice history" detail="Guardian-visible tuition invoices per child or enrollment." />
              <Requirement icon={<CreditCard className="size-4" />} title="Payment method" detail="Stored payer method, autopay status, and billing contact for the guardian workflow." />
              <Requirement icon={<Receipt className="size-4" />} title="Outstanding balance" detail="Open tuition balance, due dates, and child-level fee breakdown." />
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function Requirement({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-foreground/70">
        {icon}
        <span className="text-sm font-black">{title}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground/60">{detail}</p>
    </div>
  );
}
