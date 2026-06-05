import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { CheckCircle2, Clock, Download } from "lucide-react";

export const Route = createFileRoute("/parent/billing")({
  head: () => ({ meta: [{ title: "QuestLMS — Tuition" }] }),
  component: ParentBillingPage,
});

const invoices = [
  { id: "INV-0042", period: "Jun 2026", amount: "$240.00", status: "open" as const, date: "Jun 15" },
  { id: "INV-0041", period: "May 2026", amount: "$240.00", status: "paid" as const, date: "May 15" },
  { id: "INV-0040", period: "Apr 2026", amount: "$240.00", status: "paid" as const, date: "Apr 15" },
  { id: "INV-0039", period: "Mar 2026", amount: "$240.00", status: "paid" as const, date: "Mar 15" },
];

function ParentBillingPage() {
  return (
    <DashboardShell>
      <TopBar title="Tuition" subtitle="Payments and invoices for your children." showStreak={false} />

      <div className="grid grid-cols-12 gap-6 mb-8">
        <section className="col-span-12 lg:col-span-7 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-3xl p-6 chunky-shadow">
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Next payment</p>
          <p className="text-4xl font-black font-mono mt-2">$240.00</p>
          <p className="text-sm font-medium opacity-90 mt-1">Due Jun 15 · Autopay enabled</p>
          <div className="flex gap-2 mt-5">
            <button className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 font-bold text-sm">Pay now</button>
            <button className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 font-bold text-sm">Manage autopay</button>
          </div>
        </section>
        <section className="col-span-12 lg:col-span-5 bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-3">
          <h3 className="font-black text-lg">Payment method</h3>
          <div className="p-4 rounded-2xl bg-muted/50 border border-border">
            <p className="font-mono font-bold">•••• 4242</p>
            <p className="text-xs text-foreground/55 font-medium mt-1">Visa · expires 09/28</p>
          </div>
          <button className="text-xs font-bold text-primary hover:underline">Update payment method</button>
        </section>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        <h3 className="font-black text-xl px-2 mb-3">Payment history</h3>
        <ul className="divide-y divide-border">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex items-center gap-4 p-3 hover:bg-muted/40 rounded-2xl">
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{inv.id}</p>
                <p className="text-xs text-foreground/55 font-medium">{inv.period} · {inv.date}</p>
              </div>
              <span className="font-mono font-black text-base shrink-0">{inv.amount}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                  inv.status === "paid" ? "bg-success/15 text-success" : "bg-accent/20 text-accent-foreground"
                }`}
              >
                {inv.status === "paid" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                {inv.status}
              </span>
              <button className="size-9 grid place-items-center rounded-xl hover:bg-foreground/10" aria-label="Download">
                <Download className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
