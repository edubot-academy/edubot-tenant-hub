import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Palette, Save, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ApiError, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useUpdateCompany,
  useUpdateCompanyBranding,
  useUploadCompanyLogo,
} from "@/lib/onboarding-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/company-admin/branding")({
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("meta.companyAdmin.branding")}` }] }),
  component: BrandingPage,
});

function BrandingPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const tenant = context.activeTenant;

  const companyId = Number(tenant.id);
  const [form, setForm] = useState({
    name: tenant.name ?? "",
    subdomain: tenant.slug ?? "",
    displayName: tenant.name ?? "",
    primaryColor: tenant.brandColor ?? "#7c3aed",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateCompany = useUpdateCompany();
  const updateBranding = useUpdateCompanyBranding();
  const uploadLogo = useUploadCompanyLogo();

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!backendEnabled) {
      toast.info(t("companyAdminBrandingPage.toast.requiresBackend"));
      return;
    }
    if (!Number.isFinite(companyId) || companyId <= 0) {
      toast.error(t("companyAdminBrandingPage.toast.invalidCompany"));
      return;
    }
    setSaving(true);
    try {
      await updateCompany.mutateAsync({
        companyId,
        patch: { name: form.name, subdomain: form.subdomain || undefined },
      });
      await updateBranding.mutateAsync({
        companyId,
        patch: { primaryColor: form.primaryColor, displayName: form.displayName || undefined },
      });
      if (logoFile) {
        await uploadLogo.mutateAsync({ companyId, file: logoFile });
      }
      toast.success(t("companyAdminBrandingPage.toast.saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("companyAdminBrandingPage.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const logoText = (form.displayName || form.name || "ED")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const previewItems = [
    { key: "dashboard", label: t("companyAdminBrandingPage.preview.items.dashboard") },
    { key: "staff", label: t("companyAdminBrandingPage.preview.items.staff") },
    { key: "courses", label: t("companyAdminBrandingPage.preview.items.courses") },
    { key: "billing", label: t("companyAdminBrandingPage.preview.items.billing") },
  ];

  return (
    <DashboardShell>
      <TopBar title={t("companyAdminBrandingPage.title")} subtitle={t("companyAdminBrandingPage.subtitle")} showStreak={false} />

      <Link
        to="/company-admin"
        className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> {t("companyAdminBrandingPage.back")}
      </Link>

      {!backendEnabled && (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
          {t("companyAdminBrandingPage.previewOnly")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-border">
              <Palette className="size-4 text-primary" />
              <h2 className="font-black text-base">{t("companyAdminBrandingPage.identity.title")}</h2>
            </div>

            <Field label={t("companyAdminBrandingPage.identity.workspaceName")} value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Field label={t("companyAdminBrandingPage.identity.displayName")} value={form.displayName} onChange={(v) => setForm((f) => ({ ...f, displayName: v }))} placeholder={t("companyAdminBrandingPage.identity.displayPlaceholder")} />
            <Field label={t("companyAdminBrandingPage.identity.subdomain")} value={form.subdomain} onChange={(v) => setForm((f) => ({ ...f, subdomain: v }))} placeholder={t("companyAdminBrandingPage.identity.subdomainPlaceholder")} />
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <h2 className="font-black text-base pb-3 border-b-2 border-border">{t("companyAdminBrandingPage.brandColor.title")}</h2>
            <div className="flex items-center gap-4">
              <label className="size-14 rounded-2xl border-4 border-border cursor-pointer overflow-hidden chunky-shadow" style={{ backgroundColor: form.primaryColor }}>
                <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="opacity-0 absolute" />
              </label>
              <div>
                <p className="font-black text-sm">{form.primaryColor.toUpperCase()}</p>
                <p className="text-xs text-foreground/55 mt-0.5">{t("companyAdminBrandingPage.brandColor.hint")}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 pt-2">
              {["#7c3aed", "#2563eb", "#16a34a", "#dc2626", "#d97706"].map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, primaryColor: c }))} className={`h-8 rounded-xl border-4 transition-all ${form.primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <h2 className="font-black text-base pb-3 border-b-2 border-border">{t("companyAdminBrandingPage.logo.title")}</h2>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl overflow-hidden border-4 border-border chunky-shadow grid place-items-center text-white font-black text-xl shrink-0" style={{ backgroundColor: form.primaryColor }}>
                {logoPreview ? <img src={logoPreview} alt={t("companyAdminBrandingPage.logo.alt")} className="size-full object-cover" /> : logoText}
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted">
                  <Upload className="size-4" /> {t("companyAdminBrandingPage.logo.upload")}
                </button>
                <p className="text-xs text-foreground/55">{t("companyAdminBrandingPage.logo.hint")}</p>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={pickFile} />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? t("companyAdminBrandingPage.actions.saving") : t("companyAdminBrandingPage.actions.save")}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/50 mb-4">{t("companyAdminBrandingPage.preview.title")}</p>
            <div className="rounded-2xl border-2 border-border overflow-hidden">
              <div className="p-3 flex items-center gap-2.5 border-b border-border bg-muted/30">
                <div className="size-8 rounded-lg grid place-items-center text-xs font-black text-white" style={{ backgroundColor: form.primaryColor }}>
                  {logoPreview ? <img src={logoPreview} alt="" className="size-full object-cover rounded-lg" /> : logoText}
                </div>
                <span className="font-black text-sm truncate">{form.displayName || form.name || t("companyAdminBrandingPage.preview.schoolFallback")}</span>
              </div>
              {previewItems.map((item) => (
                <div key={item.key} className="px-3 py-2 text-xs font-bold text-foreground/60 border-b border-border/50 last:border-b-0 first-of-type:bg-primary/10 first-of-type:text-primary" style={item.key === "dashboard" ? { color: form.primaryColor, backgroundColor: `${form.primaryColor}18` } : {}}>
                  {item.label}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-foreground/50">{t("companyAdminBrandingPage.preview.accent")}</p>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: form.primaryColor }} />
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: `${form.primaryColor}40` }} />
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: `${form.primaryColor}18` }} />
              </div>
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow text-xs text-foreground/60 space-y-1.5">
            <p className="font-black text-foreground/80 text-sm">{t("companyAdminBrandingPage.preview.current")}</p>
            <p><span className="font-bold">{t("companyAdminBrandingPage.preview.name")}:</span> {form.name || "—"}</p>
            <p><span className="font-bold">{t("companyAdminBrandingPage.preview.displayName")}:</span> {form.displayName || form.name || "—"}</p>
            <p><span className="font-bold">{t("companyAdminBrandingPage.preview.subdomain")}:</span> {form.subdomain || "—"}</p>
            <p><span className="font-bold">{t("companyAdminBrandingPage.preview.color")}:</span> {form.primaryColor}</p>
            <p><span className="font-bold">{t("companyAdminBrandingPage.preview.logo")}:</span> {logoFile ? logoFile.name : logoPreview ? t("companyAdminBrandingPage.preview.uploaded") : t("companyAdminBrandingPage.preview.none")}</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary" />
    </label>
  );
}
