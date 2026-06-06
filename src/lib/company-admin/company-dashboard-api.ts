import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyAdminDashboard = {
  generatedAt: string;
  tenant: {
    id: number;
    name: string;
    timezone: string | null;
    locale: string | null;
    featureFlags?: Record<string, boolean> | null;
    branding?: Record<string, unknown> | null;
    crmLink?: {
      linked: boolean;
      crmTenantId?: string | null;
      crmTenantSlug?: string | null;
      crmPrimaryDomain?: string | null;
    } | null;
  };
  workspace: {
    type: "tenant";
    companyId: number;
    role: string | null;
    permissions: Record<string, boolean>;
  };
  stats: {
    courses: number;
    publishedCourses: number;
    draftCourses: number;
    members: number;
    students: number;
    groups: number;
    todaySessions: number;
    upcomingSessions: number;
    attendanceRate: number | null;
    homeworkNeedsReview: number;
    certificatesPending: number;
  };
  courses: Array<{
    id: number;
    title: string;
    status?: string;
    isPublished?: boolean;
    enrolledStudents?: number;
    courseType?: string;
  }>;
  sessions: {
    today: number;
    upcoming: Array<{
      id: number;
      title: string;
      startsAt?: string | null;
      status?: string | null;
      groupName?: string | null;
      courseTitle?: string | null;
    }>;
    unmarkedAttendance: number;
    cancelled: number;
  };
  homework: {
    summary?: {
      needsReview?: number;
      missing?: number;
    };
  };
  certificates?: {
    pending?: number;
    waiting?: number;
    configuredCourses?: number;
  };
  setup: {
    progress: number;
    items: Array<{
      label: string;
      value: string;
      hint?: string | null;
    }>;
  };
  activity: Array<{
    id?: number | string;
    action?: string | null;
    targetType?: string | null;
    actorFullName?: string | null;
    actorEmail?: string | null;
    createdAt?: string | null;
  }>;
};

function companyDashboardQueryKey(companyId: number) {
  return ["company-admin-dashboard", companyId] as const;
}

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export function useCompanyAdminDashboard() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["company-admin-dashboard", "none"] : companyDashboardQueryKey(companyId),
    queryFn: () => apiRequest<CompanyAdminDashboard>(`/companies/${companyId}/dashboard`),
    enabled,
  });
}
