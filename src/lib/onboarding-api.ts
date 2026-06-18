import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";

export function useUpdateCompany() {
  return useMutation({
    mutationFn: ({ companyId, patch }: { companyId: number; patch: { name?: string; subdomain?: string } }) =>
      apiRequest<{ id: number }>(`/companies/${companyId}`, { method: "PATCH", body: patch }),
  });
}

export function useUpdateCompanyBranding() {
  return useMutation({
    mutationFn: ({ companyId, patch }: { companyId: number; patch: { primaryColor?: string; displayName?: string } }) =>
      apiRequest<{ ok: boolean }>(`/companies/${companyId}/branding`, { method: "PATCH", body: patch }),
  });
}

export function useUploadCompanyLogo() {
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiRequest<{ logoUrl: string }>(`/companies/${companyId}/upload-logo`, {
        method: "POST",
        body: fd,
      });
    },
  });
}

export function useInviteCompanyMember() {
  return useMutation({
    mutationFn: ({
      companyId,
      email,
      fullName,
      role,
    }: {
      companyId: number;
      email: string;
      fullName: string;
      role: "owner" | "company_admin" | "instructor" | "assistant" | "student" | "parent";
    }) =>
      apiRequest<{ ok: boolean }>(`/companies/${companyId}/invitations`, {
        method: "POST",
        body: { email, fullName, role, sendEmail: true },
      }),
  });
}
