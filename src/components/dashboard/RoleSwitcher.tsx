import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_ROLES, ROLE_CONFIG, useRole, type Role } from "@/lib/roles";
import { useAppContext } from "@/lib/app-context";

const COLOR_BY_ROLE: Record<Role, string> = {
  owner: "bg-secondary text-secondary-foreground",
  company_admin: "bg-foreground text-background",
  assistant: "bg-muted text-foreground",
  instructor: "bg-primary text-primary-foreground",
  student: "bg-accent text-accent-foreground",
  parent: "bg-streak text-background",
};

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { role, setRole, isBackendControlled } = useRole();
  const { context } = useAppContext();
  const navigate = useNavigate();

  if (isBackendControlled) {
    return (
      <div className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 text-left">
        <span
          className={`size-9 rounded-xl grid place-items-center font-black text-sm uppercase shrink-0 ${COLOR_BY_ROLE[role]}`}
        >
          {t(`roles.${role}`).slice(0, 1)}
        </span>
        {!compact && (
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {context.activeTenant.name}
            </span>
            <span className="block text-sm font-bold truncate">{t(`roles.${role}`)}</span>
          </span>
        )}
      </div>
    );
  }

  const handleSelect = (next: Role) => {
    setRole(next);
    navigate({ to: ROLE_CONFIG[next].home });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 text-left transition-colors hover:bg-muted"
        aria-label="Switch role"
      >
        <span
          className={`size-9 rounded-xl grid place-items-center font-black text-sm uppercase shrink-0 ${COLOR_BY_ROLE[role]}`}
        >
          {t(`roles.${role}`).slice(0, 1)}
        </span>
        {!compact && (
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {t("roleSwitcher.viewingAs")}
            </span>
            <span className="block text-sm font-bold truncate">{t(`roles.${role}`)}</span>
          </span>
        )}
        <ChevronsUpDown className="size-4 text-foreground/40 shrink-0" strokeWidth={2.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          {t("roleSwitcher.switchRole")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((r) => (
          <DropdownMenuItem
            key={r}
            onSelect={() => handleSelect(r)}
            className="flex items-center gap-3"
          >
            <span
              className={`size-7 rounded-lg grid place-items-center font-black text-xs uppercase shrink-0 ${COLOR_BY_ROLE[r]}`}
            >
              {t(`roles.${r}`).slice(0, 1)}
            </span>
            <span className="flex-1 font-bold">{t(`roles.${r}`)}</span>
            {r === role && <Check className="size-4 text-primary" strokeWidth={3} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
