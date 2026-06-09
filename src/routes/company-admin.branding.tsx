import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Palette, Save, Upload } from "lucide-react";
import { useRef, useState } from "react";
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

export const Route = createFileRoute("/company-admin/branding")({
  head: () => ({ meta: [{ title: "QuestLMS — Branding" }] }),
  component: BrandingPage,
});

function BrandingPage() {
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
      toast.info("Branding changes require backend mode.");
      return;
    }
    if (!Number.isFinite(companyId) || companyId <= 0) {
      toast.error("Invalid company ID.");
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
      toast.success("Branding saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save branding.");
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

  return (
    <DashboardShell>
      <TopBar title="Branding" subtitle="Customise your workspace's look and identity." showStreak={false} />

      <Link
        to="/company-admin"
        className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> Admin
      </Link>

      {!backendEnabled && (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm font-medium text-amber-800 dark:text-amber-200">
          Preview only — connect to a backend workspace to save changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Identity */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-border">
              <Palette className="size-4 text-primary" />
              <h2 className="font-black text-base">Identity</h2>
            </div>

            <Field
              label="Workspace name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Field
              label="Display name (shown to students)"
              value={form.displayName}
              onChange={(v) => setForm((f) => ({ ...f, displayName: v }))}
              placeholder="Same as workspace name if blank"
            />
            <Field
              label="Subdomain"
              value={form.subdomain}
              onChange={(v) => setForm((f) => ({ ...f, subdomain: v }))}
              placeholder="e.g. myschool"
            />
          </section>

          {/* Brand color */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <h2 className="font-black text-base pb-3 border-b-2 border-border">Brand colour</h2>

            <div className="flex items-center gap-4">
              <label
                className="size-14 rounded-2xl border-4 border-border cursor-pointer overflow-hidden chunky-shadow"
                style={{ backgroundColor: form.primaryColor }}
              >
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="opacity-0 absolute"
                />
              </label>
              <div>
                <p className="font-black text-sm">{form.primaryColor.toUpperCase()}</p>
                <p className="text-xs text-foreground/55 mt-0.5">Click the swatch to pick a colour</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {["#7c3aed", "#2563eb", "#16a34a", "#dc2626", "#d97706"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, primaryColor: c }))}
                  className={`h-8 rounded-xl border-4 transition-all ${form.primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </section>

          {/* Logo */}
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-4">
            <h2 className="font-black text-base pb-3 border-b-2 border-border">Logo</h2>

            <div className="flex items-center gap-4">
              <div
                className="size-16 rounded-2xl overflow-hidden border-4 border-border chunky-shadow grid place-items-center text-white font-black text-xl shrink-0"
                style={{ backgroundColor: form.primaryColor }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="size-full object-cover" />
                ) : (
                  logoText
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted"
                >
                  <Upload className="size-4" /> Upload logo
                </button>
                <p className="text-xs text-foreground/55">PNG or SVG, max 2 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                className="hidden"
                onChange={pickFile}
              />
            </div>
          </section>

          {/* Save */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving…" : "Save branding"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/50 mb-4">Preview</p>

            {/* Mini sidebar preview */}
            <div className="rounded-2xl border-2 border-border overflow-hidden">
              <div className="p-3 flex items-center gap-2.5 border-b border-border bg-muted/30">
                <div
                  className="size-8 rounded-lg grid place-items-center text-xs font-black text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="size-full object-cover rounded-lg" />
                  ) : (
                    logoText
                  )}
                </div>
                <span className="font-black text-sm truncate">{form.displayName || form.name || "Your School"}</span>
              </div>
              {["Dashboard", "Staff", "Courses", "Billing"].map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 text-xs font-bold text-foreground/60 border-b border-border/50 last:border-b-0 first-of-type:bg-primary/10 first-of-type:text-primary"
                  style={item === "Dashboard" ? { color: form.primaryColor, backgroundColor: `${form.primaryColor}18` } : {}}
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-foreground/50">Accent</p>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: form.primaryColor }} />
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: `${form.primaryColor}40` }} />
                <div className="h-8 flex-1 rounded-xl" style={{ backgroundColor: `${form.primaryColor}18` }} />
              </div>
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow text-xs text-foreground/60 space-y-1.5">
            <p className="font-black text-foreground/80 text-sm">Current values</p>
            <p><span className="font-bold">Name:</span> {form.name || "—"}</p>
            <p><span className="font-bold">Display name:</span> {form.displayName || form.name || "—"}</p>
            <p><span className="font-bold">Subdomain:</span> {form.subdomain || "—"}</p>
            <p><span className="font-bold">Color:</span> {form.primaryColor}</p>
            <p><span className="font-bold">Logo:</span> {logoFile ? logoFile.name : logoPreview ? "Uploaded" : "None"}</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider text-foreground/60 mb-1.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary"
      />
    </label>
  );
}
