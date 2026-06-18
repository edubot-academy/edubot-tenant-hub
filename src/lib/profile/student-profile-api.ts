import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";

export const STUDENT_PROFILE_QUERY_KEY = ["student-profile"] as const;
export const STUDENT_CERTIFICATES_QUERY_KEY = ["student-certificates"] as const;

export type StudentProfile = {
  generatedAt: string;
  student: {
    id: number;
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
    joinedAt: string;
    title: string | null;
    bio: string | null;
  };
  gamification: {
    xp: number;
    streak: number;
    badges: number;
    lessonsCompleted: number;
    quizzesCompleted: number;
    lastActivityAt: string | null;
  };
  summary: {
    activeCourses: number;
    completedCourses: number;
    certificatesIssued: number;
    averageProgressPercent: number;
    attendanceRate: number | null;
    lessonsCompleted: number;
    lessonsTotal: number;
  };
  courses: Array<{
    courseId: number;
    courseTitle: string;
    groupId: number | null;
    groupName: string | null;
    progressPercent: number;
    status: "active" | "completed" | "upcoming";
    completedAt: string | null;
    attendanceRate: number | null;
    certificate: {
      id?: number;
      publicId?: string;
      status?: string;
      issuedAt?: string | null;
      downloadUrl?: string | null;
      verificationUrl?: string;
    } | null;
  }>;
  certificates: Array<{
    id?: number;
    publicId?: string;
    courseId: number;
    courseTitle: string;
    groupId?: number | null;
    groupName?: string | null;
    issuedAt: string | null;
    downloadUrl: string | null;
    verificationUrl?: string;
    status?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    slug: string | null;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    xp: number;
    lastActivityAt: string | null;
  }>;
  activity: Array<{
    id: string;
    type: "certificate" | "feedback" | "course_completion";
    date: string | null;
    title: string;
    subtitle: string | null;
    score: number | null;
    courseId: number | null;
    courseTitle: string | null;
    status: string | null;
  }>;
};

export type StudentCertificate = {
  id?: number;
  publicId?: string;
  courseId: number;
  courseTitle: string;
  groupId?: number | null;
  groupName?: string | null;
  issuedAt: string | null;
  downloadUrl: string | null;
  verificationUrl?: string;
  status?: string;
};

export function useStudentProfile() {
  return useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => apiRequest<StudentProfile>("/student/profile"),
    enabled: isBackendApiEnabled(),
  });
}

export function useStudentCertificates() {
  return useQuery({
    queryKey: STUDENT_CERTIFICATES_QUERY_KEY,
    queryFn: () => apiRequest<StudentCertificate[]>("/student/certificates"),
    enabled: isBackendApiEnabled(),
  });
}
