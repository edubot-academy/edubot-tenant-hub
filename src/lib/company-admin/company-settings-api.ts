import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyHierarchySettings = {
  hierarchyCoursesEnabled?: boolean | null;
  hierarchyModulesEnabled?: boolean | null;
};

type CompanyRecord = {
  id: number;
  settings?: CompanyHierarchySettings | null;
};

type UpdateCompanySettingsInput = CompanyHierarchySettings;

function companySettingsQueryKey(companyId: number) {
  return ["company-settings", companyId] as const;
}

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export function useCompanySettings() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["company-settings", "none"] : companySettingsQueryKey(companyId),
    queryFn: () => apiRequest<CompanyRecord>(`/companies/${companyId}`),
    enabled,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: UpdateCompanySettingsInput) =>
      apiRequest<CompanyRecord>(`/companies/${companyId}/settings`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: async (result) => {
      if (companyId !== null) {
        queryClient.setQueryData(companySettingsQueryKey(companyId), result);
      }
    },
  });
}
