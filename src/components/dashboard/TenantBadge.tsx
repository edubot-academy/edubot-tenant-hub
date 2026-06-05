import { useTranslation } from "react-i18next";
import { useTenant } from "@/hooks/use-tenant";
import { useAppContext } from "@/lib/app-context";

type TenantBadgeProps = {
  className?: string;
};

type TenantBrandProps = {
  compact?: boolean;
};

export function TenantBadge({ className = "hidden md:flex" }: TenantBadgeProps) {
  const { t } = useTranslation();
  const tenant = useTenant();
  const { isLoading } = useAppContext();
  const detail = isLoading
    ? "Loading"
    : tenant.status
      ? tenant.status
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
  const tenant = useTenant();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-xl grid place-items-center font-black text-xl italic text-white chunky-shadow overflow-hidden"
        style={{ backgroundColor: tenant.brandColor }}
      >
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt="" className="size-full object-cover" />
        ) : (
          tenant.logoText
        )}
      </div>
      <span
        className={
          compact
            ? "max-w-[180px] truncate text-lg font-extrabold tracking-tighter uppercase"
            : "max-w-[180px] truncate text-2xl font-extrabold tracking-tighter uppercase"
        }
      >
        {tenant.name}
      </span>
    </div>
  );
}
