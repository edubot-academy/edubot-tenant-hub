import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyStaffRole = "owner" | "company_admin" | "assistant" | "instructor" | "student" | "parent";

export type CompanyMemberRecord = {
  id: number;
  userId: number;
  companyId: number;
  role: CompanyStaffRole;
  status: "invited" | "active" | "suspended";
  invitedByUserId: number | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string | null;
  email: string | null;
  invitation: {
    status: "completed" | "expired" | "pending" | "not_started";
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean | null;
    sentAt: string | null;
  } | null;
  onboarding: {
    status: "completed" | "expired" | "pending" | "not_started";
    setupRequired: boolean;
    setupCompleted: boolean;
    setupCompletedAt: string | null;
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean | null;
  };
};

type CompanyMemberMutationResult = {
  ok?: boolean;
  messageKey?: string;
};

export type InviteCompanyMemberInput = {
  fullName: string;
  email: string;
  role: "company_admin" | "assistant" | "instructor";
  sendEmail?: boolean;
};

type SetCompanyMemberRoleInput = {
  userId: number;
  role: "company_admin" | "assistant" | "instructor";
  mode?: "replace" | "add";
  fromRole?: CompanyStaffRole;
};

type RemoveCompanyMemberInput = {
  userId: number;
  role?: CompanyStaffRole;
};

type ResendCompanyInvitationInput = {
  userId: number;
  sendEmail?: boolean;
};

function companyStaffQueryKey(companyId: number) {
  return ["company-staff", companyId] as const;
}

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export function useCompanyStaff() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["company-staff", "none"] : companyStaffQueryKey(companyId),
    queryFn: () => apiRequest<CompanyMemberRecord[]>(`/companies/${companyId}/members`),
    enabled,
  });
}

export function useInviteCompanyMember() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: InviteCompanyMemberInput) =>
      apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/invitations`, {
        method: "POST",
        body: input,
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useSetCompanyMemberRole() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: SetCompanyMemberRoleInput) =>
      apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/members/${input.userId}`, {
        method: "PATCH",
        body: {
          role: input.role,
          mode: input.mode,
          fromRole: input.fromRole,
        },
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useRemoveCompanyMember() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: RemoveCompanyMemberInput) =>
      apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/members/${input.userId}`, {
        method: "DELETE",
        params: input.role ? { role: input.role } : undefined,
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useResendCompanyInvitation() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: ResendCompanyInvitationInput) =>
      apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/invitations/${input.userId}/resend`, {
        method: "POST",
        body: { sendEmail: input.sendEmail ?? true },
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}
