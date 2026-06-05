import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, tenantStore } from "@/lib/api/client";
import { ROLE_CONFIG, type Role } from "@/lib/roles";
import { useAppContext, type AppWorkspace } from "@/lib/app-context";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in ROLE_CONFIG;
}

function roleHome(role: AppWorkspace["role"]) {
  return ROLE_CONFIG[isRole(role) ? role : "owner"].home;
}

function workspaceCompanyId(workspace: AppWorkspace) {
  const id = Number(workspace.companyId ?? workspace.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function workspaceInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ED"
  );
}

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { context, refetch } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [switchingId, setSwitchingId] = useState<string | number | null>(null);

  const tenantWorkspaces = context.workspaces.filter((workspace) => workspace.type === "tenant");
  const activeTenantId = Number(context.activeTenant.id);
  const activeWorkspace =
    tenantWorkspaces.find((workspace) => Number(workspace.companyId ?? workspace.id) === activeTenantId) ??
    tenantWorkspaces[0];

  if (!activeWorkspace) {
    return (
      <div className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 text-left">
        <span className="size-9 rounded-xl grid place-items-center bg-muted text-foreground/60">
          <Building2 className="size-4" strokeWidth={2.5} />
        </span>
        {!compact && (
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {t("workspace.current", { defaultValue: "Workspace" })}
            </span>
            <span className="block text-sm font-bold truncate">{context.activeTenant.name}</span>
          </span>
        )}
      </div>
    );
  }

  const canSwitch = tenantWorkspaces.length > 1;

  const handleSelect = async (workspace: AppWorkspace) => {
    const companyId = workspaceCompanyId(workspace);
    if (!companyId || companyId === activeTenantId) return;

    setSwitchingId(workspace.id);
    tenantStore.set(companyId);

    try {
      await apiRequest("/companies/workspaces/switch", {
        method: "POST",
        body: { companyId },
        skipTenantHeader: true,
      }).catch(() => undefined);

      await queryClient.invalidateQueries({ queryKey: ["app-context"] });
      const nextContext = await refetch();
      navigate({ to: roleHome(nextContext?.activeRole ?? workspace.role) });
      toast.success(t("workspace.switched", { defaultValue: "Workspace switched" }));
    } catch {
      toast.error(t("workspace.switchFailed", { defaultValue: "Could not switch workspace" }));
    } finally {
      setSwitchingId(null);
    }
  };

  const trigger = (
    <div className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 text-left transition-colors hover:bg-muted">
      <span
        className="size-9 rounded-xl grid place-items-center font-black text-sm uppercase shrink-0 text-white"
        style={{ backgroundColor: context.activeTenant.brandColor }}
      >
        {context.activeTenant.logoUrl ? (
          <img src={context.activeTenant.logoUrl} alt="" className="size-full rounded-xl object-cover" />
        ) : (
          context.activeTenant.logoText || workspaceInitials(activeWorkspace.name)
        )}
      </span>
      {!compact && (
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/40">
            {t(`roles.${context.activeRole}`)}
          </span>
          <span className="block text-sm font-bold truncate">{context.activeTenant.name}</span>
        </span>
      )}
      {canSwitch && <ChevronsUpDown className="size-4 text-foreground/40 shrink-0" strokeWidth={2.5} />}
    </div>
  );

  if (!canSwitch) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full" aria-label={t("workspace.switch", { defaultValue: "Switch workspace" })}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          {t("workspace.switch", { defaultValue: "Switch workspace" })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenantWorkspaces.map((workspace) => {
          const companyId = workspaceCompanyId(workspace);
          const active = companyId === activeTenantId;
          return (
            <DropdownMenuItem
              key={`${workspace.type}-${workspace.id}`}
              disabled={!companyId || switchingId === workspace.id}
              onSelect={(event) => {
                event.preventDefault();
                void handleSelect(workspace);
              }}
              className="flex items-center gap-3"
            >
              <span className="size-8 rounded-lg grid place-items-center bg-muted font-black text-xs uppercase shrink-0">
                {workspaceInitials(workspace.name)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold truncate">{workspace.name}</span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  {isRole(workspace.role) ? t(`roles.${workspace.role}`) : workspace.role}
                </span>
              </span>
              {active && <Check className="size-4 text-primary" strokeWidth={3} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
