import { useTranslation } from "react-i18next";
import { Palette, Upload, Globe } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";

export function BrandingPanel() {
  const { t } = useTranslation();
  const tenant = useTenant();

  return (
    <section className="col-span-12 lg:col-span-6 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Palette className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.branding.title")}</h3>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl border border-dashed border-border">
          <div
            className="size-12 rounded-lg grid place-items-center text-sm font-black text-white"
            style={{ backgroundColor: tenant.brandColor }}
            aria-hidden
          >
            {tenant.logoText}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{tenant.name}</div>
            <div className="text-[11px] text-foreground/55 font-medium">
              {t("admin.branding.logoHint")}
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-bold hover:bg-muted cursor-pointer">
            <Upload className="size-3" strokeWidth={3} />
            {t("admin.branding.upload")}
          </button>
        </div>

        <div className="col-span-1 p-3 rounded-xl border border-border">
          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2">
            {t("admin.branding.primaryColor")}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-7 rounded-md border border-border"
              style={{ backgroundColor: tenant.brandColor }}
              aria-hidden
            />
            <span className="font-mono text-xs font-semibold">{tenant.brandColor}</span>
          </div>
        </div>

        <div className="col-span-1 p-3 rounded-xl border border-border">
          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2 flex items-center gap-1.5">
            <Globe className="size-3" strokeWidth={3} />
            {t("admin.branding.domain")}
          </div>
          <div className="font-mono text-xs font-semibold truncate">
            {tenant.slug}.questlms.app
          </div>
        </div>

        <div className="col-span-2 p-3 rounded-xl border border-border">
          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2">
            {t("admin.branding.customDomain")}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="learn.yourbrand.com"
              className="flex-1 bg-background border border-border rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button className="px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer">
              {t("admin.branding.verify")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
