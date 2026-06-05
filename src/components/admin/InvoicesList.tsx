import { useTranslation } from "react-i18next";
import { FileText, Download, CheckCircle2, Clock, XCircle } from "lucide-react";

export type InvoiceStatus = "paid" | "open" | "failed";

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
  period: string;
}

const STATUS_ICON: Record<InvoiceStatus, typeof CheckCircle2> = {
  paid: CheckCircle2,
  open: Clock,
  failed: XCircle,
};

const STATUS_TONE: Record<InvoiceStatus, string> = {
  paid: "text-primary bg-primary/10",
  open: "text-streak bg-streak/10",
  failed: "text-destructive bg-destructive/10",
};

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const { t } = useTranslation();

  return (
    <section className="col-span-12 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <FileText className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.invoices.title")}</h3>
        <span className="ml-auto text-[11px] font-mono text-foreground/55">{invoices.length}</span>
      </div>
      <div className="divide-y divide-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_120px_80px] gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/50">
          <span>{t("admin.billing.invoices.col.id")}</span>
          <span>{t("admin.billing.invoices.col.period")}</span>
          <span>{t("admin.billing.invoices.col.date")}</span>
          <span className="text-right">{t("admin.billing.invoices.col.amount")}</span>
          <span className="text-right">{t("admin.billing.invoices.col.status")}</span>
        </div>
        {invoices.map((inv) => {
          const Icon = STATUS_ICON[inv.status];
          return (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_1fr_1fr_120px_80px] gap-2 px-4 py-3 items-center hover:bg-muted/40 group"
            >
              <span className="font-mono text-xs font-semibold">{inv.id}</span>
              <span className="text-xs text-foreground/70">{inv.period}</span>
              <span className="text-xs text-foreground/70">{inv.date}</span>
              <span className="text-right font-mono text-sm font-bold">${inv.amount.toLocaleString()}</span>
              <div className="flex items-center justify-end gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_TONE[inv.status]}`}
                >
                  <Icon className="size-3" strokeWidth={3} />
                  {t(`admin.billing.invoices.status.${inv.status}`)}
                </span>
                <button
                  aria-label={t("admin.billing.invoices.download")}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted cursor-pointer"
                >
                  <Download className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
