import { useTranslation } from "react-i18next";
import { useTenant } from "@/hooks/use-tenant";

export function TenantBadge() {
  const { t } = useTranslation();
  const tenant = useTenant();

  return (
    <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-xl pl-1.5 pr-3 py-1.5">
      <div
        className="size-7 rounded-lg grid place-items-center text-[10px] font-black text-white"
        style={{ backgroundColor: tenant.brandColor }}
        aria-hidden
      >
        {tenant.logoText}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-bold truncate max-w-[140px]">{tenant.name}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
          {t(`tenant.plan.${tenant.plan}`)}
        </span>
      </div>
    </div>
  );
}
