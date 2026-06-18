import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyIntegrationRecord = {
  id: number;
  name: string;
  featureFlags?: Record<string, boolean> | null;
  host?: string | null;
  crmLink?: {
    linked: boolean;
    crmTenantId?: string | null;
    crmTenantSlug?: string | null;
    crmPrimaryDomain?: string | null;
    status?: string | null;
  } | null;
  permissions?: Record<string, boolean> | null;
};

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export function useCompanyIntegrationRecord() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["company-integrations", "none"] : ["company-integrations", companyId],
    queryFn: () => apiRequest<CompanyIntegrationRecord>(`/companies/${companyId}`),
    enabled,
  });
}
