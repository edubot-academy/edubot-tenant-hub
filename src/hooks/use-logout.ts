import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { logout, tenantStore, tokenStore } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export function useLogout({ onBeforeNavigate }: { onBeforeNavigate?: () => void } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { isBackendEnabled } = useAppContext();

  return async () => {
    try {
      if (isBackendEnabled) {
        await logout();
      } else {
        tokenStore.clear();
        tenantStore.clear();
      }
    } catch {
      tokenStore.clear();
      tenantStore.clear();
      toast.error(t("sidebar.logoutFailed"));
    } finally {
      queryClient.removeQueries({ queryKey: ["app-context"] });
      onBeforeNavigate?.();
      navigate({ to: "/auth" });
    }
  };
}
