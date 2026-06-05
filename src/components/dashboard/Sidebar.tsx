import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Target } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/lib/roles";
import { RoleSwitcher } from "./RoleSwitcher";
import { TenantBrand } from "./TenantBadge";
import { logout, tenantStore, tokenStore } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { config } = useRole();
  const { isBackendEnabled } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    let serverLogoutFailed = false;
    try {
      if (isBackendEnabled) {
        await logout();
      } else {
        tokenStore.clear();
        tenantStore.clear();
      }
    } catch {
      serverLogoutFailed = true;
      tokenStore.clear();
      tenantStore.clear();
    } finally {
      queryClient.removeQueries({ queryKey: ["app-context"] });
      onNavigate?.();
      navigate({ to: "/auth" });
      if (serverLogoutFailed) {
        toast.error("Signed out locally. Server logout failed.");
      }
    }
  };

  return (
    <nav className="w-64 h-full shrink-0 border-r border-border bg-card p-6 flex flex-col gap-6">
      <Link to="/" onClick={onNavigate} className="px-2">
        <TenantBrand />
      </Link>

      <RoleSwitcher />

      <div className="flex flex-col gap-1.5 overflow-y-auto -mx-2 px-2">
        {config.nav.map(({ icon: Icon, labelKey, to, key }) => {
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
        <div className="p-4 bg-accent/15 rounded-3xl border-2 border-accent/30 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-accent-foreground/60" strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-widest text-accent-foreground/60">
              {t("goal.teacherGoal")}
            </span>
          </div>
          <div className="h-3 w-full bg-card rounded-full overflow-hidden border border-accent/30">
            <div className="h-full bg-accent w-[65%]" />
          </div>
          <span className="text-sm font-bold">{t("goal.lessonsMastery", { done: 12, total: 20 })}</span>
        </div>

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
