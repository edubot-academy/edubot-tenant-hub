import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { logout, tenantStore, tokenStore } from "@/lib/api/client";

export function NoWorkspaceAccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      tokenStore.clear();
      tenantStore.clear();
      toast.error(t("noWorkspace.toast.localLogout"));
    } finally {
      queryClient.removeQueries({ queryKey: ["app-context"] });
      navigate({ to: "/auth" });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center chunky-shadow">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-muted text-foreground">
          <Building2 className="size-7" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("noWorkspace.title")}
        </h1>
        <p className="mt-2 text-sm font-medium text-foreground/60">
          {t("noWorkspace.body")}
        </p>
        <p className="mt-3 text-sm font-medium text-foreground/60">
          {t("noWorkspace.help")}
        </p>
        <Button onClick={handleLogout} className="mt-6 font-bold">
          <LogOut className="size-4" strokeWidth={2.5} />
          {t("actions.logout")}
        </Button>
      </div>
    </div>
  );
}
