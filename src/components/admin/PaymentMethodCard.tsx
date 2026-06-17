import { useTranslation } from "react-i18next";
import { CreditCard, Pencil } from "lucide-react";
import { useState } from "react";

type PaymentMethodCardProps = {
  available?: boolean;
  brand?: string | null;
  last4?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  cardholderName?: string | null;
  billingEmail?: string | null;
  disabled?: boolean;
  onSave?: (input: {
    available: boolean;
    brand: string | null;
    last4: string | null;
    expiryMonth: number | null;
    expiryYear: number | null;
    cardholderName: string | null;
    billingEmail: string | null;
  }) => Promise<void> | void;
  isSaving?: boolean;
};

export function PaymentMethodCard({
  available = true,
  brand = "Visa",
  last4 = "4242",
  expiryMonth = 12,
  expiryYear = 27,
  cardholderName = "ACME ACADEMY",
  billingEmail = "billing@acme.kg",
  disabled = false,
  onSave,
  isSaving = false,
}: PaymentMethodCardProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    available,
    brand: brand ?? "",
    last4: last4 ?? "",
    expiryMonth: expiryMonth ? String(expiryMonth) : "",
    expiryYear: expiryYear ? String(expiryYear) : "",
    cardholderName: cardholderName ?? "",
    billingEmail: billingEmail ?? "",
  });

  const canEdit = Boolean(onSave) && !disabled;

  return (
    <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <CreditCard className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.billing.payment.title")}</h3>
      </div>
      <div className="p-4 space-y-4">
        {editing ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))}
              />
              {t("billingPage.payment.available")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder={t("billingPage.payment.fields.brand")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.last4}
                maxLength={4}
                onChange={(e) => setForm((prev) => ({ ...prev, last4: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder={t("billingPage.payment.fields.last4")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.expiryMonth}
                onChange={(e) => setForm((prev) => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                placeholder={t("billingPage.payment.fields.expiryMonth")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={form.expiryYear}
                onChange={(e) => setForm((prev) => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder={t("billingPage.payment.fields.expiryYear")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              value={form.cardholderName}
              onChange={(e) => setForm((prev) => ({ ...prev, cardholderName: e.target.value }))}
              placeholder={t("billingPage.payment.fields.cardholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={form.billingEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, billingEmail: e.target.value }))}
              placeholder={t("billingPage.payment.fields.email")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await onSave?.({
                    available: form.available,
                    brand: form.brand.trim() || null,
                    last4: form.last4.trim() || null,
                    expiryMonth: form.expiryMonth ? Number(form.expiryMonth) : null,
                    expiryYear: form.expiryYear ? Number(form.expiryYear) : null,
                    cardholderName: form.cardholderName.trim() || null,
                    billingEmail: form.billingEmail.trim() || null,
                  });
                  setEditing(false);
                }}
                disabled={isSaving}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {isSaving ? t("billingPage.payment.saving") : t("billingPage.payment.save")}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={isSaving}
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold"
              >
                {t("billingPage.payment.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <>
        {available ? (
          <div className="relative rounded-xl bg-gradient-to-br from-foreground to-foreground/70 text-background p-4 aspect-[1.586/1] flex flex-col justify-between shadow-lg">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{brand}</span>
              <div className="size-6 rounded bg-streak/80" />
            </div>
            <div>
              <div className="font-mono text-base tracking-[0.2em]">•••• •••• •••• {last4}</div>
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono opacity-80">
                <span>{cardholderName}</span>
                <span>{String(expiryMonth).padStart(2, "0")}/{String(expiryYear).padStart(2, "0")}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
            {t("billingPage.payment.unavailable")}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {t("admin.billing.payment.billedTo")}
            </div>
            <div className="text-xs font-semibold mt-0.5">{billingEmail}</div>
          </div>
          <button
            onClick={() => {
              setForm({
                available,
                brand: brand ?? "",
                last4: last4 ?? "",
                expiryMonth: expiryMonth ? String(expiryMonth) : "",
                expiryYear: expiryYear ? String(expiryYear) : "",
                cardholderName: cardholderName ?? "",
                billingEmail: billingEmail ?? "",
              });
              setEditing(true);
            }}
            disabled={!canEdit}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs font-bold hover:bg-muted disabled:cursor-not-allowed disabled:text-foreground/40 cursor-pointer"
          >
            <Pencil className="size-3" strokeWidth={3} />
            {t("admin.billing.payment.update")}
          </button>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
