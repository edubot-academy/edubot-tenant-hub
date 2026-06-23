import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiFetchRaw, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type CertificateStatus = "pending_approval" | "issued" | "rejected" | "revoked";
export type CertificateIssueMode = "manual" | "auto";
export type CertificateApprovalMode = "none" | "instructor" | "admin";

export type CourseCertificateSettings = {
  id?: number;
  courseId?: number;
  enabled: boolean;
  issueMode: CertificateIssueMode;
  approvalMode: CertificateApprovalMode;
  allowReissue: boolean;
  certificateTitle?: string | null;
  certificateLanguage?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  pageOrientation?: "landscape" | "portrait" | null;
  secondaryBrandName?: string | null;
  secondaryBrandLogoUrl?: string | null;
  issuerDisplayName?: string | null;
  issuerTitle?: string | null;
  signatureAssetUrl?: string | null;
  eligibilityAttendanceRequired?: boolean;
  eligibilityAttendancePercent?: number | null;
  eligibilityHomeworkRequired?: boolean;
  eligibilityHomeworkPercent?: number | null;
  eligibilityActivitiesRequired?: boolean;
  eligibilityActivitiesPercent?: number | null;
};

export type CertificateRecord = {
  id: number;
  publicId: string;
  courseId: number;
  studentId: number;
  studentName?: string | null;
  studentEmail?: string | null;
  status: CertificateStatus;
  issuedAt?: string | null;
  approvedAt?: string | null;
  revokedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  downloadUrl?: string | null;
  verificationUrl?: string | null;
  source?: string | null;
};

export type CourseCertificatesResponse = {
  items: CertificateRecord[];
  total: number;
  page: number;
  limit: number;
};

export type CertificateVerificationRecord = {
  publicId: string;
  status: CertificateStatus;
  verificationUrl?: string | null;
  issuedAt?: string | null;
  revokedAt?: string | null;
  rejectedAt?: string | null;
  primaryBrandName?: string | null;
  secondaryBrandName?: string | null;
  certificateTitle?: string | null;
  studentFullName?: string | null;
  courseTitle?: string | null;
  issuerDisplayName?: string | null;
  issuerTitle?: string | null;
};

function certSettingsKey(courseId: number) {
  return ["cert-settings", courseId] as const;
}

function certListKey(courseId: number, params?: { status?: string; page?: number; limit?: number }) {
  return [
    "cert-list",
    courseId,
    params?.status ?? "all",
    params?.page ?? 1,
    params?.limit ?? 50,
  ] as const;
}

function certListPrefix(courseId: number) {
  return ["cert-list", courseId] as const;
}

function normalizeCourseCertificatesResponse(
  response: CourseCertificatesResponse | CertificateRecord[],
  params?: { page?: number; limit?: number },
): CourseCertificatesResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      total: response.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? response.length ?? 50,
    };
  }
  return response;
}

export function useCourseCertificateSettings(courseId: number | null) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: courseId === null ? (["cert-settings", "none"] as const) : certSettingsKey(courseId),
    queryFn: () => apiRequest<CourseCertificateSettings>(`/courses/${courseId}/certificate-settings`),
    enabled: isBackendApiEnabled() && context.mode === "backend" && courseId !== null,
  });
}

export function useUpdateCourseCertificateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, patch }: { courseId: number; patch: Partial<CourseCertificateSettings> }) =>
      apiRequest<CourseCertificateSettings>(`/courses/${courseId}/certificate-settings`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certSettingsKey(courseId) });
    },
  });
}

export function useCourseCertificates(
  courseId: number | null,
  params?: { status?: string; page?: number; limit?: number },
) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: courseId === null ? (["cert-list", "none"] as const) : certListKey(courseId, params),
    queryFn: () =>
      apiRequest<CourseCertificatesResponse | CertificateRecord[]>(`/courses/${courseId}/certificates`, {
        params: params as Record<string, string | number | boolean | null | undefined>,
      }).then((response) => normalizeCourseCertificatesResponse(response, params)),
    enabled: isBackendApiEnabled() && context.mode === "backend" && courseId !== null,
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      studentId,
      allowEligibilityOverride,
    }: {
      courseId: number;
      studentId: number;
      allowEligibilityOverride?: boolean;
    }) =>
      apiRequest(`/courses/${courseId}/certificates/issue`, {
        method: "POST",
        body: { studentId, allowEligibilityOverride },
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certListPrefix(courseId) });
    },
  });
}

export function useApproveCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, courseId }: { certificateId: number; courseId: number }) =>
      apiRequest(`/certificates/${certificateId}/approve`, { method: "POST" }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certListPrefix(courseId) });
    },
  });
}

export function useRejectCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      certificateId,
      courseId,
      reason,
    }: {
      certificateId: number;
      courseId: number;
      reason?: string;
    }) =>
      apiRequest(`/certificates/${certificateId}/reject`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certListPrefix(courseId) });
    },
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      certificateId,
      courseId,
      reason,
    }: {
      certificateId: number;
      courseId: number;
      reason?: string;
    }) =>
      apiRequest(`/certificates/${certificateId}/revoke`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certListPrefix(courseId) });
    },
  });
}

export function useRegenerateCertificates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId }: { courseId: number }) =>
      apiRequest(`/courses/${courseId}/certificates/regenerate`, {
        method: "POST",
        body: {},
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: certListPrefix(courseId) });
    },
  });
}

export function useUploadCertificateSignature() {
  return useMutation({
    mutationFn: ({ courseId, file }: { courseId: number; file: File }) => {
      const fd = new FormData();
      fd.append("signature", file);
      return apiRequest<{ signatureUrl: string }>(
        `/courses/${courseId}/certificate-settings/upload-signature`,
        { method: "POST", body: fd },
      );
    },
  });
}

export function useUploadCertificateSecondaryLogo() {
  return useMutation({
    mutationFn: ({ courseId, file }: { courseId: number; file: File }) => {
      const fd = new FormData();
      fd.append("logo", file);
      return apiRequest<{ secondaryBrandLogoUrl: string }>(
        `/courses/${courseId}/certificate-settings/upload-secondary-logo`,
        { method: "POST", body: fd },
      );
    },
  });
}

export async function fetchCertificatePreviewHtml(
  courseId: number,
  params: Record<string, string | null | undefined>,
): Promise<string> {
  const resp = await apiFetchRaw(`/courses/${courseId}/certificate-preview`, {
    method: "POST",
    body: params,
  });
  if (!resp.ok) throw new Error("Preview unavailable");
  return resp.text();
}

export async function fetchCertificateVerification(publicId: string) {
  return apiRequest<CertificateVerificationRecord>(`/certificates/${publicId}/verify`, {
    method: "GET",
    skipTenantHeader: true,
  });
}

export async function downloadCertificatePdf(publicId: string) {
  const resp = await apiFetchRaw(`/certificates/${publicId}/download`, {
    method: "GET",
    skipTenantHeader: true,
  });
  if (!resp.ok) throw new Error("Download unavailable");
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${publicId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
