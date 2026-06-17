import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useRole } from "@/lib/roles";
import { RoleSwitcher } from "./RoleSwitcher";
import { TenantBrand } from "./TenantBadge";
import { useAppContext } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/route-access";
import { useLogout } from "@/hooks/use-logout";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { config, isBackendControlled } = useRole();
  const { context } = useAppContext();
  const { pathname } = useLocation();
  const navItems = isBackendControlled
    ? config.nav.filter((item) => canAccessRoute(item.to, context.activeRole))
    : config.nav;

  const handleLogout = useLogout({ onBeforeNavigate: onNavigate });

  return (
    <nav className="w-64 h-full shrink-0 border-r border-border bg-card p-6 flex flex-col gap-6">
      <Link to="/" onClick={onNavigate}>
        <TenantBrand />
      </Link>

      <RoleSwitcher />

      <div className="flex flex-col gap-1.5 overflow-y-auto -mx-2 px-2">
        {navItems.map(({ icon: Icon, labelKey, to, key }) => {
          const active =
            to === config.home
              ? pathname === to
              : pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={key}
              to={to}
              onClick={onNavigate}
              className={
                active
                  ? "flex items-center gap-4 p-3 bg-primary/10 text-primary rounded-2xl font-bold transition-all"
                  : "flex items-center gap-4 p-3 text-foreground/50 hover:bg-foreground/5 rounded-2xl font-bold transition-all"
              }
            >
              <Icon className="size-5" strokeWidth={2.5} />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-bold text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <LogOut className="size-4" strokeWidth={2.5} />
          {t("actions.logout")}
        </button>
      </div>
    </nav>
  );
}
