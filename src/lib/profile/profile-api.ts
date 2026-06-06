import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

export const MY_PROFILE_QUERY_KEY = ["my-profile"] as const;
export const TIMEZONE_STORAGE_KEY = "questlms.timezone";

export type MyProfile = {
  id: number;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  title?: string | null;
  platformRole: string;
  tenantRole: "owner" | "company_admin" | "assistant" | "instructor" | "student" | "parent";
  tenantStatus: "active" | "invited" | "suspended";
  locale: "ky" | "ru" | "en";
  timezone: string;
  joinedAt: string;
  socialLinks?: {
    website?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    telegram?: string | null;
  };
  notificationPreferences: {
    emailDigest: boolean;
    announcements: boolean;
    grades: boolean;
    messages: boolean;
    marketing: boolean;
    notifyByEmail: boolean;
    notifyByWhatsApp: boolean;
    notifyByTelegram: boolean;
    notifyForPayments: boolean;
  };
};

export type UpdateMyProfileInput = {
  fullName?: string;
  title?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  socialLinks?: Record<string, string | null>;
  yearsOfExperience?: number | null;
  expertiseTags?: string[];
};

export type UpdateMyPreferencesInput = {
  notifyByEmail?: boolean;
  notifyByWhatsApp?: boolean;
  notifyByTelegram?: boolean;
  notifyForPayments?: boolean;
  locale?: "ky" | "ru" | "en";
  timezone?: string;
};

type ProfileMutationResponse = {
  message: string;
  messageKey: string;
  profile: MyProfile;
};

export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: () => apiRequest<MyProfile>("/profile/me"),
    enabled: isBackendApiEnabled(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) =>
      apiRequest<ProfileMutationResponse>("/profile/me", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, result.profile);
    },
  });
}

export function useUpdateMyPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyPreferencesInput) =>
      apiRequest<ProfileMutationResponse>("/profile/me/preferences", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, result.profile);
    },
  });
}
