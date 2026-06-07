import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import type { StudentProfile } from "@/lib/profile/student-profile-api";

export const PARENT_HOME_QUERY_KEY = ["parent-portal-home"] as const;
export const PARENT_CHILDREN_QUERY_KEY = ["parent-portal-children"] as const;
export const PARENT_SCHEDULE_QUERY_KEY = ["parent-portal-schedule"] as const;
export const PARENT_MESSAGES_QUERY_KEY = ["parent-portal-messages"] as const;

export type ParentChildSummary = {
  studentId: number;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
  progressPercent: number;
  attendanceRate: number | null;
  certificatesIssued: number;
  activeCourseCount: number;
  activeClassCount: number;
  nextSessionAt: string | null;
  nextSessionTitle: string | null;
  primaryLabel: string | null;
};

export type ParentChildDetail = ParentChildSummary & {
  profile: StudentProfile;
  home: {
    nextSession: {
      sessionTitle?: string;
      courseTitle?: string | null;
      startsAt?: string;
      location?: string | null;
    } | null;
    urgentTasks: Array<{
      id: number;
      kind: "homework" | "activity" | "quiz";
      title: string;
      courseTitle: string | null;
      dueAt: string | null;
      status: string;
    }>;
    recentFeedback: Array<{
      taskId: number;
      kind: "homework" | "activity" | "quiz";
      title: string;
      courseTitle: string | null;
      status: string;
      score: number | null;
      reviewComment: string | null;
      createdAt: string | null;
    }>;
  };
  classes: Array<{
    id: number;
    name: string;
    code: string;
    gradeLevel: string | null;
    academicYear: string | null;
  }>;
  courses: Array<{
    courseId: number;
    title: string;
    groupName: string | null;
    progressPercent: number;
    status: "active" | "completed" | "upcoming";
  }>;
};

export type ParentScheduleItem = {
  studentId: number;
  studentName: string;
  sessionId: number;
  courseId: number | null;
  courseTitle: string | null;
  groupId: number | null;
  groupName: string | null;
  sessionTitle: string;
  startsAt?: string;
  startAt?: string;
  endsAt?: string;
  endAt?: string;
  status: string;
  location: string | null;
  liveProvider: string | null;
};

export type ParentHomeSession = {
  studentId: number;
  studentName: string;
  sessionId: number;
  courseId: number | null;
  courseTitle: string | null;
  sessionTitle: string;
  startsAt?: string;
  startAt?: string;
  endsAt?: string;
  status: string;
  location: string | null;
  liveProvider: string | null;
};

export type ParentHome = {
  generatedAt: string;
  parent: { id: number; fullName: string | null; email: string | null };
  children: ParentChildSummary[];
  upcomingSessions: ParentHomeSession[];
};

export type ParentChildProgress = {
  studentId: number;
  studentName: string | null;
  courses: Array<{
    courseId: number;
    title: string;
    groupName: string | null;
    progressPercent: number;
    status: "active" | "completed" | "upcoming";
    completedAt: string | null;
  }>;
  summary: {
    completedCourses: number;
    activeCourses: number;
    averageProgressPercent: number;
    certificatesIssued: number;
  };
};

export type ParentChildAttendance = {
  studentId: number;
  studentName: string | null;
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number | null;
  };
  records: Array<{
    id: number;
    sessionDate: string | null;
    status: string;
    courseId: number | null;
    sessionId: number | null;
    notes: string | null;
  }>;
};

export type ParentMessageItem = {
  id: number;
  companyId: number;
  studentId: number;
  studentName: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  ownerRole: "assistant" | "admin" | "instructor";
  message: string;
  dueAt: string | null;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export function useParentHome() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: PARENT_HOME_QUERY_KEY,
    queryFn: () => apiRequest<ParentHome>("/parent/home"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useParentChildProgress(studentId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && studentId !== null;
  return useQuery({
    queryKey: ["parent-portal-child-progress", studentId],
    queryFn: () => apiRequest<ParentChildProgress>(`/parent/children/${studentId}/progress`),
    enabled,
  });
}

export function useParentChildAttendance(
  studentId: number | null,
  params?: { limit?: number; from?: string; to?: string },
) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && studentId !== null;
  return useQuery({
    queryKey: ["parent-portal-child-attendance", studentId, params],
    queryFn: () =>
      apiRequest<ParentChildAttendance>(`/parent/children/${studentId}/attendance`, {
        params: params as Record<string, unknown>,
      }),
    enabled,
  });
}

export function useParentChildren() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: PARENT_CHILDREN_QUERY_KEY,
    queryFn: () => apiRequest<ParentChildSummary[]>("/parent/children"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useParentChildSummary(studentId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && studentId !== null;

  return useQuery({
    queryKey: ["parent-portal-child-summary", studentId],
    queryFn: () => apiRequest<ParentChildDetail>(`/parent/children/${studentId}/summary`),
    enabled,
  });
}

export function useParentSchedule() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: PARENT_SCHEDULE_QUERY_KEY,
    queryFn: () => apiRequest<ParentScheduleItem[]>("/parent/schedule"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useParentMessages() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: PARENT_MESSAGES_QUERY_KEY,
    queryFn: () => apiRequest<ParentMessageItem[]>("/parent/messages"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}
