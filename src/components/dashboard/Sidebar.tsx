import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { useRole } from "@/lib/roles";
import { RoleSwitcher } from "./RoleSwitcher";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { config } = useRole();
  const { pathname } = useLocation();

  return (
    <nav className="w-64 h-full shrink-0 border-r border-border bg-card p-6 flex flex-col gap-6">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <div className="size-10 bg-secondary text-secondary-foreground rounded-xl grid place-items-center font-black text-xl italic chunky-shadow">
          Q
        </div>
        <span className="font-extrabold text-2xl tracking-tighter uppercase">{t("app.name")}</span>
      </Link>

      <RoleSwitcher />

      <div className="flex flex-col gap-1.5 overflow-y-auto -mx-2 px-2">
        {config.nav.map(({ icon: Icon, labelKey, to, key }, idx) => {
          const active = idx === 0 ? pathname === to : pathname.startsWith(to) && idx !== 0;
          // first nav item is "home" — exact match only
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

      <div className="mt-auto p-4 bg-accent/15 rounded-3xl border-2 border-accent/30 flex flex-col gap-3">
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
    </nav>
  );
}
