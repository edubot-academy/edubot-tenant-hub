import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export const STUDENT_PORTAL_COURSES_QUERY_KEY = ["student-portal-courses"] as const;
export const STUDENT_PORTAL_CLASSES_QUERY_KEY = ["student-portal-classes"] as const;
export const STUDENT_PORTAL_CLASS_DETAIL_QUERY_KEY = ["student-portal-class-detail"] as const;
export const STUDENT_PORTAL_TASKS_QUERY_KEY = ["student-portal-tasks"] as const;
export const STUDENT_PORTAL_SUPPORT_REQUESTS_QUERY_KEY = ["student-portal-support-requests"] as const;
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
  aiAssistantEnabled: boolean;
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

export type StudentPortalNextSession = {
  sessionId?: number;
  sessionTitle?: string;
  courseTitle?: string | null;
  groupName?: string | null;
  startsAt?: string;
  startAt?: string;
  location?: string | null;
  liveJoinUrl?: string | null;
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

export type StudentPortalLessonItem = {
  lessonId: number;
  title: string;
  kind: "video" | "article" | "quiz" | "code";
  duration: number | null;
  order: number;
  coverImageUrl: string | null;
  isPublished: boolean;
  completed: boolean;
  lastVideoTime: number | null;
};

export type StudentPortalSectionItem = {
  sectionId: number;
  title: string;
  order: number;
  lessons: StudentPortalLessonItem[];
};

export type StudentPortalLessonDetail = {
  lessonId: number;
  sectionId: number;
  courseId: number;
  title: string;
  kind: "video" | "article" | "quiz" | "code";
  content: string | null;
  duration: number | null;
  order: number;
  coverImageUrl: string | null;
  playbackUrl: string | null;
  videoUrl: string | null;
  resourceUrl: string | null;
  resourceName: string | null;
  playbackStatus: string | null;
  playbackType: string | null;
  completed: boolean;
  lastVideoTime: number | null;
  prevLessonId: number | null;
  nextLessonId: number | null;
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
  nextLesson: { lessonId: number; title: string; lastVideoTime: number | null } | null;
  sections: StudentPortalSectionItem[];
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

export function useStudentPortalLessonDetail(courseId: number | null, lessonId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null && lessonId !== null;

  return useQuery({
    queryKey: ["student-portal-lesson-detail", courseId, lessonId],
    queryFn: () =>
      apiRequest<StudentPortalLessonDetail>(
        `/student/courses/${courseId}/lessons/${lessonId}`,
      ),
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

// ─── Student access state ────────────────────────────────────────────────────

export type StudentAccessState = {
  hasActiveAccess: boolean;
  activeEnrollmentCount: number;
  pendingEnrollmentCount: number;
  latestEnrollment: {
    enrollmentId: number;
    courseId: number | null;
    courseName: string | null;
    groupId: number | null;
    groupName: string | null;
    enrollmentStatus: string;
    accessStatus: string;
    enrolledAt: string;
  } | null;
  message: string;
  messageKey: string;
};

export const STUDENT_PORTAL_ACCESS_QUERY_KEY = ["student-portal-access"] as const;

export function useStudentAccess() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_ACCESS_QUERY_KEY,
    queryFn: () => apiRequest<StudentAccessState>("/student/access"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

// ─── Student dashboard (same endpoint as main app, company-scoped) ───────────

export type StudentDashboardStats = {
  upcomingSessions: number;
  availableRecordings: number;
  homeworkOpen: number;
  attendanceRate: number | null;
};

export type StudentDashboardSession = {
  id?: number;
  sessionId?: number;
  sessionTitle?: string;
  startsAt?: string;
  startAt?: string;
  courseTitle?: string | null;
  groupName?: string | null;
  location?: string | null;
  liveJoinUrl?: string | null;
};

export type StudentDashboardHomework = {
  id: number;
  kind: "homework" | "activity" | "quiz";
  title: string;
  courseId: number | null;
  courseTitle: string | null;
  sessionId: number;
  dueAt: string | null;
  status: string;
  submission: unknown | null;
  attempt: unknown | null;
};

export type StudentDashboardFeedback = {
  taskId: number;
  kind: "homework" | "activity" | "quiz";
  title: string;
  courseId: number | null;
  courseTitle: string | null;
  status: string;
  score: number | null;
  reviewComment: string | null;
  createdAt: string | null;
};

export type StudentDashboardProgress = {
  averageProgressPercent: number;
  openTasks: number;
  overdueTasks: number;
  attendanceRate: number | null;
  certificatesIssued: number;
};

export type StudentDashboard = {
  generatedAt: string;
  student: {
    id: number;
    fullName: string | null;
    email: string | null;
  };
  nextSession: StudentDashboardSession | null;
  urgentTasks: StudentDashboardHomework[];
  recentFeedback: StudentDashboardFeedback[];
  activeCourses: StudentPortalCourse[];
  progress: StudentDashboardProgress;
  stats: StudentDashboardStats;
  upcomingSessions: StudentDashboardSession[];
  recordings: Array<Record<string, unknown>> | { items: Array<Record<string, unknown>>; total: number };
  homework: StudentDashboardHomework[];
  attendance: Array<Record<string, unknown>> | { items: Array<Record<string, unknown>>; total: number };
};

export const STUDENT_PORTAL_DASHBOARD_QUERY_KEY = ["student-portal-dashboard"] as const;

export function useStudentPortalDashboard(opts?: { courseId?: number; groupId?: number; limit?: number }) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: [...STUDENT_PORTAL_DASHBOARD_QUERY_KEY, opts?.courseId, opts?.groupId, opts?.limit],
    queryFn: () =>
      apiRequest<StudentDashboard>("/student/dashboard", {
        params: {
          ...(opts?.courseId !== undefined && { courseId: opts.courseId }),
          ...(opts?.groupId !== undefined && { groupId: opts.groupId }),
          ...(opts?.limit !== undefined && { limit: opts.limit }),
        },
      }),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

// ─── Support options (categories, priorities, contact policy) ────────────────

export type StudentSupportCategory = {
  id: string;
  label: string;
  labelKey: string;
};

export type StudentSupportOptions = {
  companyId: number;
  supportEmail: string | null;
  categories: StudentSupportCategory[];
  priorities: string[];
  contactPolicy: {
    canContactInstructorDirectly: boolean;
    canContactAdminDirectly: boolean;
    requestsGoTo: string;
  };
};

export const STUDENT_PORTAL_SUPPORT_OPTIONS_QUERY_KEY = ["student-portal-support-options"] as const;

export function useStudentSupportOptions() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: STUDENT_PORTAL_SUPPORT_OPTIONS_QUERY_KEY,
    queryFn: () => apiRequest<StudentSupportOptions>("/student/support/options"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

// ─── Activity quiz submission ─────────────────────────────────────────────────

export type QuizAttemptAnswer = {
  questionId: number;
  optionIds: number[];
};

export type QuizAttemptResult = {
  attemptId: number;
  score: number;
  maxScore: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  answers?: Array<{
    questionId: number;
    isCorrect: boolean;
    selectedOptionIds: number[];
    correctOptionIds: number[];
  }>;
};

export function useSubmitActivityQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      activityId,
      answers,
    }: {
      sessionId: number;
      activityId: number;
      answers: QuizAttemptAnswer[];
    }) =>
      apiRequest<QuizAttemptResult>(
        `/student/sessions/${sessionId}/activities/${activityId}/quiz-attempt`,
        { method: "POST", body: { answers } },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_PORTAL_TASKS_QUERY_KEY });
    },
  });
}
