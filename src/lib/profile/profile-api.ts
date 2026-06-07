import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

export const MY_PROFILE_QUERY_KEY = ["my-profile"] as const;
export const INSTRUCTOR_PROFILE_QUERY_KEY = ["instructor-profile", "me"] as const;
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
    github?: string | null;
    youtube?: string | null;
  };
  yearsOfExperience?: number | null;
  expertiseTags?: string[];
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

export type InstructorProfile = {
  user: MyProfile;
  publicProfile: {
    headline?: string | null;
    bio?: string | null;
    expertiseTags: string[];
    yearsOfExperience?: number | null;
    socialLinks?: MyProfile["socialLinks"];
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    activeCourses: number;
    averageCourseRating?: number | null;
    reviewCount: number;
    certificatesIssued?: number;
  };
  courses: Array<{
    id: number;
    title: string;
    courseType: "video" | "offline" | "online_live";
    status: string;
    studentsCount: number;
    ratingAverage?: number | null;
    ratingCount?: number;
  }>;
  courseReviews: Array<{
    id: string | number;
    studentName: string;
    rating: number;
    comment: string;
    createdAt: string;
    courseTitle?: string | null;
  }>;
};

export type UpdateInstructorProfileInput = {
  headline?: string | null;
  bio?: string | null;
  expertiseTags?: string[];
  yearsOfExperience?: number | null;
  socialLinks?: Record<string, string | null>;
};

type ProfileMutationResponse = {
  message: string;
  messageKey: string;
  profile: MyProfile;
};

type InstructorProfileMutationResponse = {
  message: string;
  messageKey: string;
  profile: InstructorProfile;
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

export function useInstructorProfile() {
  return useQuery({
    queryKey: INSTRUCTOR_PROFILE_QUERY_KEY,
    queryFn: () => apiRequest<InstructorProfile>("/profile/instructor/me"),
    enabled: isBackendApiEnabled(),
  });
}

export function useUpdateInstructorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateInstructorProfileInput) =>
      apiRequest<InstructorProfileMutationResponse>("/profile/instructor/me", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(INSTRUCTOR_PROFILE_QUERY_KEY, result.profile);
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, result.profile.user);
    },
  });
}
