import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export const STUDENT_PORTAL_COURSES_QUERY_KEY = ["student-portal-courses"] as const;
export const STUDENT_PORTAL_CLASSES_QUERY_KEY = ["student-portal-classes"] as const;
export const STUDENT_PORTAL_CLASS_DETAIL_QUERY_KEY = ["student-portal-class-detail"] as const;
export const STUDENT_PORTAL_TASKS_QUERY_KEY = ["student-portal-tasks"] as const;
export const STUDENT_PORTAL_SUPPORT_REQUESTS_QUERY_KEY = ["student-portal-support-requests"] as const;
export const STUDENT_PORTAL_HOME_QUERY_KEY = ["student-portal-home"] as const;
export const STUDENT_PORTAL_REMINDERS_QUERY_KEY = ["student-portal-reminders"] as const;

export type StudentPortalCourse = {
  courseId: number;
  groupId: number | null;
  courseType: "video" | "offline" | "online_live";
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  instructor: { id: number | null; name: string | null };
  instructorName: string | null;
  groupName: string | null;
  progressPercent: number;
  status: "active" | "completed" | "upcoming";
  nextLesson: { lessonId: number; title: string; lastVideoTime?: number | null } | null;
  nextSession: { id?: number; startsAt?: string; startAt?: string; sessionTitle?: string } | null;
  completedAt: string | null;
};

export type StudentPortalClass = {
  id: number;
  name: string;
  code: string;
  gradeLevel: string | null;
  academicYear: string | null;
  timezone: string;
  status: string;
  advisor: { id: number | null; name: string | null };
  studentCount: number;
  activeCourseCount: number;
  nextSessionAt: string | null;
  courseIds: number[];
};

export type StudentPortalClassDetail = StudentPortalClass & {
  courses: Array<{
    id: number;
    courseId: number;
    title: string;
    courseType: "video" | "offline" | "online_live";
    instructor: {
      id: number | null;
      name: string | null;
    };
    term: string | null;
    status: string;
  }>;
  upcomingSessions: Array<{
    id: number;
    sessionTitle: string;
    sessionIndex: number;
    startsAt?: string;
    startAt?: string;
    endsAt?: string;
    endAt?: string;
    status: string;
    courseTitle: string | null;
    location: string | null;
    instructorName: string | null;
  }>;
  attendance: {
    total: number;
    presentOrLate: number;
    rate: number | null;
  };
};

export type StudentPortalReminder = {
  id: string;
  kind: "session" | "task";
  title: string;
  message: string;
  dueAt: string | null;
  status: "today" | "upcoming" | "overdue" | "needs_revision";
  priority: "low" | "medium" | "high";
  courseId: number | null;
  courseTitle: string | null;
  groupId: number | null;
  groupName: string | null;
  sessionId: number | null;
  taskId: number | null;
  taskKind?: "homework" | "activity" | "quiz";
  actionUrl: string;
};

export type StudentPortalHome = {
  generatedAt: string;
  student: {
    id: number;
    fullName: string | null;
    email: string | null;
  };
  nextSession: {
    sessionId?: number;
    sessionTitle?: string;
    courseTitle?: string | null;
    groupName?: string | null;
    startsAt?: string;
    startAt?: string;
    location?: string | null;
    liveJoinUrl?: string | null;
  } | null;
  urgentTasks: Array<{
    id: number;
    kind: "homework" | "activity" | "quiz";
    title: string;
    courseId: number | null;
    courseTitle: string | null;
    sessionId: number;
    dueAt: string | null;
    status: string;
  }>;
  recentFeedback: Array<{
    taskId: number;
    kind: "homework" | "activity" | "quiz";
    title: string;
    courseId: number | null;
    courseTitle: string | null;
    status: string;
    score: number | null;
    reviewComment: string | null;
    createdAt: string | null;
  }>;
  activeCourses: StudentPortalCourse[];
  progress: {
    averageProgressPercent: number;
    openTasks: number;
    overdueTasks: number;
    attendanceRate: number | null;
    certificatesIssued: number;
  };
};

export type StudentPortalSupportRequest = {
  id: number;
  companyId: number;
  studentId: number;
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

export type StudentPortalTask = {
  id: number;
  kind: "homework" | "activity" | "quiz";
  sessionId: number;
  courseId: number | null;
  groupId: number | null;
  title: string;
  description: string | null;
  courseTitle: string | null;
  sessionTitle: string | null;
  dueAt: string | null;
  status: "open" | "overdue" | "submitted" | "needs_revision" | "approved" | "completed" | "graded";
  submission: {
    id: number;
    answerText?: string | null;
    attachmentUrl?: string | null;
    submittedAt?: string | null;
    score?: number | null;
    reviewComment?: string | null;
    status?: string | null;
  } | null;
  attempt: {
    id: number;
    score?: number | null;
    passed?: boolean | null;
    createdAt?: string | null;
  } | null;
};

export type StudentPortalCourseDetail = {
  course: {
    courseId: number;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    courseType: "video" | "offline" | "online_live";
    instructor: { id: number | null; name: string | null };
    groupId: number | null;
    groupName: string | null;
    status: "active" | "completed" | "upcoming";
    completedAt: string | null;
  };
  progress: {
    progressPercent: number;
    status: "active" | "completed" | "upcoming";
    completedAt: string | null;
  } | null;
  sessions: Array<{
    id: number;
    sessionTitle: string;
    sessionIndex: number;
    startAt?: string;
    endAt?: string;
    startsAt?: string;
    endsAt?: string;
    status: string;
    location: string | null;
    instructorName: string | null;
  }>;
  tasks: Array<{
    id: number;
    kind: "homework" | "activity" | "quiz";
    title: string;
    status: string;
    dueAt: string | null;
    sessionTitle: string | null;
    courseTitle: string | null;
  }>;
  certificate: { id?: number; publicId?: string; issuedAt?: string | null } | null;
};

export function useStudentPortalCourses() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_COURSES_QUERY_KEY,
    queryFn: () => apiRequest<StudentPortalCourse[]>("/student/courses"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useStudentPortalClasses() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_CLASSES_QUERY_KEY,
    queryFn: () => apiRequest<StudentPortalClass[]>("/student/classes"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useStudentPortalCourseDetail(courseId: number | null, groupId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null;

  return useQuery({
    queryKey: ["student-portal-course-detail", courseId, groupId],
    queryFn: () => apiRequest<StudentPortalCourseDetail>(`/student/courses/${courseId}`, {
      params: groupId === null ? undefined : { groupId },
    }),
    enabled,
  });
}

export function useStudentPortalClassDetail(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: [...STUDENT_PORTAL_CLASS_DETAIL_QUERY_KEY, classId],
    queryFn: () => apiRequest<StudentPortalClassDetail>(`/student/classes/${classId}`),
    enabled,
  });
}

export function useStudentPortalTasks() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_TASKS_QUERY_KEY,
    queryFn: () => apiRequest<StudentPortalTask[]>("/student/tasks", { params: { limit: 200 } }),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useStudentSupportRequests() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_SUPPORT_REQUESTS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiRequest<{ items: StudentPortalSupportRequest[] } | StudentPortalSupportRequest[]>("/student/support/requests", {
        params: { limit: 100 },
      });
      return Array.isArray(response) ? response : response.items;
    },
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useStudentPortalHome() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_HOME_QUERY_KEY,
    queryFn: () => apiRequest<StudentPortalHome>("/student/home"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useStudentPortalReminders() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_REMINDERS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiRequest<{ items: StudentPortalReminder[] } | StudentPortalReminder[]>("/student/reminders", {
        params: { limit: 20 },
      });
      return Array.isArray(response) ? response : response.items;
    },
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}
