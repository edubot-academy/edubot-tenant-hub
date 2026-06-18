import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyFeatureFlags = {
  attendance?: boolean;
  homework?: boolean;
  certificates?: boolean;
  liveSessions?: boolean;
  "courses.offline.enabled"?: boolean;
  "aiAssistant.enabled"?: boolean;
  [key: string]: boolean | undefined;
};

export type CompanyEnrollmentSettings = {
  supportEmail?: string | null;
  defaultCourseVisibility?: "PUBLIC" | "PRIVATE" | "TENANT_ONLY" | null;
  allowSelfEnrollment?: boolean | null;
  requireEnrollmentApproval?: boolean | null;
};

export type CompanyHierarchySettings = {
  hierarchyCoursesEnabled?: boolean | null;
  hierarchyModulesEnabled?: boolean | null;
};

export type CompanySettings = CompanyHierarchySettings & CompanyEnrollmentSettings;

export type CompanyRecord = {
  id: number;
  settings?: CompanySettings | null;
  featureFlags?: CompanyFeatureFlags | null;
};

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
    mutationFn: (input: CompanyHierarchySettings) =>
      apiRequest<CompanyRecord>(`/companies/${companyId}/settings`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (result) => {
      if (companyId !== null) {
        queryClient.setQueryData(companySettingsQueryKey(companyId), result);
      }
    },
  });
}

export function useUpdateEnrollmentSettings() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CompanyEnrollmentSettings) =>
      apiRequest<CompanyRecord>(`/companies/${companyId}/settings`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (result) => {
      if (companyId !== null) {
        queryClient.setQueryData(companySettingsQueryKey(companyId), result);
      }
    },
  });
}

export function useUpdateFeatureFlags() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (flags: Record<string, boolean>) =>
      apiRequest<CompanyRecord>(`/companies/${companyId}/feature-flags`, {
        method: "PATCH",
        body: flags,
      }),
    onSuccess: (result) => {
      if (companyId !== null) {
        queryClient.setQueryData(companySettingsQueryKey(companyId), result);
      }
    },
  });
}
