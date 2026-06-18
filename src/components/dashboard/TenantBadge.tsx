import { useTranslation } from "react-i18next";
import { useTenant } from "@/hooks/use-tenant";
import { useAppContext } from "@/lib/app-context";

type TenantBadgeProps = {
  className?: string;
};

type TenantBrandProps = {
  compact?: boolean;
};

function TenantLogo({ size = "size-10" }: { size?: string }) {
  const tenant = useTenant();

  return (
    <div className={`relative shrink-0 ${size}`}>
      <div className="flex size-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-white p-1.5 shadow-sm">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt="" className="size-full object-contain" />
        ) : (
          <span
            className="flex size-full items-center justify-center rounded-xl text-[11px] font-black text-white"
            style={{ backgroundColor: tenant.brandColor }}
          >
            {tenant.logoText}
          </span>
        )}
      </div>
    </div>
  );
}

export function TenantBadge({ className = "hidden md:flex" }: TenantBadgeProps) {
  const { t } = useTranslation();
  const tenant = useTenant();
  const { isLoading } = useAppContext();
  const detail = isLoading
    ? t("tenant.status.loading", { defaultValue: "Loading" })
    : tenant.status
      ? t(`tenant.status.${tenant.status}`, { defaultValue: tenant.status })
      : t(`tenant.plan.${tenant.plan}`);

  return (
    <div className={`${className} min-w-0 items-center gap-2 bg-card border border-border rounded-xl pl-1.5 pr-3 py-1.5`}>
      <div
        className="size-7 rounded-lg grid place-items-center text-[10px] font-black text-white"
        style={{ backgroundColor: tenant.brandColor }}
        aria-hidden
      >
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt="" className="size-full rounded-lg object-cover" />
        ) : (
          tenant.logoText
        )}
      </div>
      <div className="min-w-0 flex flex-col leading-tight">
        <span className="max-w-[160px] truncate text-xs font-bold">{tenant.name}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
          {detail}
        </span>
      </div>
    </div>
  );
}

export function TenantBrand({ compact = false }: TenantBrandProps) {
  const { t } = useTranslation();
  const tenant = useTenant();
  const workspaceLabel = t("tenant.workspaceLabel", { defaultValue: "Learning workspace" });

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <TenantLogo size="size-9" />
        <div className="min-w-0 leading-tight">
          <span className="block max-w-[150px] truncate text-[13px] font-semibold tracking-tight text-foreground">
            {tenant.name}
          </span>
          <span className="block truncate text-[10px] font-medium text-muted-foreground">
            {workspaceLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-[-6px] flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/50">
      <TenantLogo />
      <div className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-semibold tracking-tight text-foreground">
          {tenant.name}
        </span>
        <span className="block truncate pt-0.5 text-[11px] font-medium text-muted-foreground">
          {workspaceLabel}
        </span>
      </div>
    </div>
  );
}
