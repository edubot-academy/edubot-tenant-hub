import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type TenantCourseRecord = {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  status?: string | null;
  isPublished?: boolean;
  courseType?: "video" | "offline" | "online_live" | string | null;
  lessonCount?: number;
  enrolledStudents?: number;
  category?: {
    id?: number;
    name?: string | null;
    title?: string | null;
  } | null;
};

export type TenantLessonRecord = {
  id: number;
  title: string;
  content?: string | null;
  previewVideo?: boolean;
  duration?: number;
  order?: number;
  resourceName?: string | null;
  coverImageUrl?: string | null;
  isPublished?: boolean;
  kind?: "video" | "article" | "quiz" | "code" | string;
  sectionId?: number;
};

export type TenantSectionRecord = {
  id: number;
  title: string;
  order: number;
  lessonCount?: number;
  durationMinutes?: number;
  durationHours?: number;
  lessons: TenantLessonRecord[];
};

export type TenantCourseListResponse = {
  items: TenantCourseRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateTenantCourseInput = {
  title: string;
  description: string;
  subtitle?: string;
};

export type TenantCourseGroupRecord = {
  id: number;
  courseId: number;
  companyId?: number | null;
  name: string;
  code: string;
  status: "planned" | "open" | "active" | "completed" | "cancelled";
  deliveryMode?: "group" | "individual";
  startDate?: string | null;
  endDate?: string | null;
  seatLimit?: number | null;
  timezone?: string;
  location?: string | null;
  activeStudentCount?: number;
  course?: TenantCourseRecord | null;
};

export type CreateTenantCourseGroupInput = {
  courseId: number;
  name: string;
  code: string;
  seatLimit?: number;
  startDate?: string;
};

export type AcademicClassRecord = {
  id: number;
  companyId: number;
  name: string;
  code: string;
  gradeLevel?: string | null;
  academicYear?: string | null;
  advisorUserId?: number | null;
  timezone: string;
  status: "active" | "inactive" | "archived";
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  activeStudentCount?: number;
  advisor?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type AcademicClassListResponse = {
  items: AcademicClassRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AcademicClassCourseRecord = {
  id: number;
  academicClassId: number;
  courseId: number;
  instructorId?: number | null;
  term?: string | null;
  status: "active" | "inactive" | "archived";
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  course?: TenantCourseRecord | null;
  instructor?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type CreateAcademicClassInput = {
  name: string;
  code: string;
  gradeLevel?: string;
  academicYear?: string;
};

export type AcademicClassCoursesResponse = {
  items: AcademicClassCourseRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AcademicSessionRecord = {
  id: number;
  academicClassId: number;
  academicClassCourseId: number;
  courseId: number;
  instructorId?: number | null;
  sessionIndex: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "completed" | "cancelled";
  location?: string | null;
  notes?: string | null;
  liveProvider?: string | null;
  liveJoinUrl?: string | null;
  course?: TenantCourseRecord | null;
  instructor?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type AcademicClassTimetableResponse = {
  items: AcademicSessionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  byDay?: Record<string, AcademicSessionRecord[]>;
};

export type CreateAcademicSessionInput = {
  classCourseId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status?: "scheduled" | "completed" | "cancelled";
  location?: string | null;
  notes?: string | null;
  liveProvider?: "zoom" | "google_meet" | "custom" | null;
  liveJoinUrl?: string | null;
  liveHostUrl?: string | null;
  externalMeetingId?: string | null;
};

export type UpdateAcademicSessionInput = {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  status?: "scheduled" | "completed" | "cancelled";
  location?: string | null;
  notes?: string | null;
  liveProvider?: "zoom" | "google_meet" | "custom" | null;
  liveJoinUrl?: string | null;
  liveHostUrl?: string | null;
  externalMeetingId?: string | null;
};

export type AcademicClassAttendanceSummary = {
  academicClass: {
    id: number;
    name: string;
    code: string;
    gradeLevel?: string | null;
    academicYear?: string | null;
    timezone: string;
    status: string;
  };
  totals: {
    sessionCount: number;
    attendanceRecordCount: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number | null;
  };
  students: Array<{
    studentId: number;
    enrollmentId: number;
    fullName: string | null;
    email: string | null;
    joinedAt: string;
    attendance: {
      total: number;
      present: number;
      late: number;
      absent: number;
      excused: number;
      rate: number | null;
      lastMarkedAt: string | null;
    };
  }>;
};

export type AcademicClassReport = {
  generatedAt: string;
  academicClass: {
    id: number;
    name: string;
    code: string;
    gradeLevel?: string | null;
    academicYear?: string | null;
    timezone: string;
    status: string;
  };
  summary: {
    studentCount: number;
    activeCourseCount: number;
    sessionCount: number;
    completedSessionCount: number;
    attendanceRate: number | null;
    homeworkSubmissionRate: number | null;
    averageHomeworkScore: number | null;
    averageActivityScore: number | null;
    averageQuizScore: number | null;
  };
  courses: AcademicClassCourseRecord[];
  students: Array<{
    studentId: number;
    enrollmentId: number;
    fullName: string | null;
    email: string | null;
    joinedAt: string;
    attendance: {
      total: number;
      present: number;
      late: number;
      absent: number;
      excused: number;
      rate: number | null;
    };
    homework: {
      assigned: number;
      submitted: number;
      graded: number;
      averageScore: number | null;
    };
    activities: {
      assigned: number;
      submitted: number;
      graded: number;
      averageScore: number | null;
    };
    quizzes: {
      assigned: number;
      attempts: number;
      passed: number;
      averageScore: number | null;
    };
  }>;
};

export type AcademicSessionAttendanceRecord = {
  id: number;
  userId: number;
  courseId: number;
  sessionId: number | null;
  academicSessionId: number | null;
  enrollmentId: number | null;
  companyId: number | null;
  sessionDate: string | null;
  status: "present" | "absent" | "late" | "excused";
  joinedAt: string | null;
  leftAt: string | null;
  markedByUserId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademicSessionAttendanceResponse = {
  items: AcademicSessionAttendanceRecord[];
  total: number;
};

export type AcademicClassStudentRecord = {
  id: number;
  academicClassId: number;
  studentId: number;
  status: "active" | "inactive";
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: number;
    fullName: string | null;
    email: string | null;
    phoneNumber?: string | null;
    avatar?: string | null;
  } | null;
};

export type AcademicClassStudentsResponse = {
  items: AcademicClassStudentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AcademicSessionHomeworkRecord = {
  id: number;
  academicSessionId: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number | null;
  isPublished: boolean;
  assignedStudentIds: number[] | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAcademicSessionHomeworkInput = {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  maxScore?: number | null;
  isPublished?: boolean;
  assignedStudentIds?: number[];
};

export type UpdateAcademicSessionHomeworkInput = CreateAcademicSessionHomeworkInput;

export type AcademicSessionHomeworkSubmissionRecord = {
  id: number;
  homeworkId: number;
  studentId: number;
  answerText: string | null;
  attachmentUrl: string | null;
  status: "submitted" | "approved" | "rejected" | "needs_revision";
  score: number | null;
  reviewComment: string | null;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type AcademicSessionActivityRecord = {
  id: number;
  academicSessionId: number;
  type: "discussion" | "exercise" | "quiz" | "group_work";
  title: string;
  description: string | null;
  status: "planned" | "active" | "done";
  position: number;
  questions?: Array<{
    id?: number;
    prompt: string;
    questionMode?: "single_choice" | "multiple_choice";
    options: Array<{ id?: number; text: string; isCorrect?: boolean }>;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type CreateAcademicSessionActivityInput = {
  title: string;
  description?: string | null;
  type: "discussion" | "exercise" | "quiz" | "group_work";
  status: "planned" | "active" | "done";
};

export type UpdateAcademicSessionActivityInput = CreateAcademicSessionActivityInput;

export type AcademicSessionActivitySubmissionRecord = {
  id: number;
  activityId: number;
  studentId: number;
  answerText: string | null;
  attachmentUrl: string | null;
  status: "submitted" | "approved" | "rejected" | "needs_revision";
  score: number | null;
  reviewComment: string | null;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type AcademicSessionActivityQuizResponseRecord = {
  studentId: number;
  studentName: string;
  latestAttemptId: number;
  attemptsCount: number;
  score: number;
  passed: boolean;
  answeredCount: number;
  submittedAt: string;
};

export type AcademicSessionActivityResponsesResponse =
  | {
      activity: AcademicSessionActivityRecord;
      mode: "submission";
      items: AcademicSessionActivitySubmissionRecord[];
    }
  | {
      activity: AcademicSessionActivityRecord;
      mode: "quiz";
      items: AcademicSessionActivityQuizResponseRecord[];
    };

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

function coursesQueryKey(companyId: number) {
  return ["tenant-lms-courses", companyId] as const;
}

function groupsQueryKey(companyId: number) {
  return ["tenant-lms-groups", companyId] as const;
}

function academicClassesQueryKey(companyId: number) {
  return ["tenant-academic-classes", companyId] as const;
}

function academicClassDetailQueryKey(classId: number) {
  return ["tenant-academic-class", classId] as const;
}

function academicClassCoursesQueryKey(classId: number) {
  return ["tenant-academic-class-courses", classId] as const;
}

function academicClassTimetableQueryKey(classId: number) {
  return ["tenant-academic-class-timetable", classId] as const;
}

function academicClassAttendanceSummaryQueryKey(classId: number) {
  return ["tenant-academic-class-attendance-summary", classId] as const;
}

function academicClassStudentsQueryKey(classId: number) {
  return ["tenant-academic-class-students", classId] as const;
}

function academicClassReportQueryKey(classId: number) {
  return ["tenant-academic-class-report", classId] as const;
}

function academicSessionAttendanceQueryKey(sessionId: number) {
  return ["tenant-academic-session-attendance", sessionId] as const;
}

function academicSessionHomeworkQueryKey(sessionId: number) {
  return ["tenant-academic-session-homework", sessionId] as const;
}

function academicSessionActivitiesQueryKey(sessionId: number) {
  return ["tenant-academic-session-activities", sessionId] as const;
}

function academicSessionHomeworkSubmissionsQueryKey(sessionId: number, homeworkId: number) {
  return ["tenant-academic-session-homework-submissions", sessionId, homeworkId] as const;
}

function academicSessionActivityResponsesQueryKey(sessionId: number, activityId: number) {
  return ["tenant-academic-session-activity-responses", sessionId, activityId] as const;
}

function courseDetailQueryKey(courseId: number) {
  return ["tenant-lms-course", courseId] as const;
}

function courseSectionsQueryKey(courseId: number) {
  return ["tenant-lms-course-sections", courseId] as const;
}

export function useTenantCourses() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["tenant-lms-courses", "none"] : coursesQueryKey(companyId),
    queryFn: () => apiRequest<TenantCourseListResponse>(`/courses/company/${companyId}`),
    enabled,
  });
}

export function useCreateTenantCourse() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateTenantCourseInput) =>
      apiRequest<TenantCourseRecord>("/courses", {
        method: "POST",
        body: {
          title: input.title,
          description: input.description,
          price: 0,
          subtitle: input.subtitle,
          isPaid: false,
          courseType: "offline",
        },
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function useTenantCourse(courseId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null;

  return useQuery({
    queryKey: courseId === null ? ["tenant-lms-course", "none"] : courseDetailQueryKey(courseId),
    queryFn: () => apiRequest<TenantCourseRecord>(`/courses/${courseId}`),
    enabled,
  });
}

export function useTenantCourseSections(courseId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null;

  return useQuery({
    queryKey: courseId === null ? ["tenant-lms-course-sections", "none"] : courseSectionsQueryKey(courseId),
    queryFn: () => apiRequest<TenantSectionRecord[]>(`/courses/${courseId}/sections`),
    enabled,
  });
}

export function useCreateTenantSection(courseId: number | null) {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: { title: string; order: number }) =>
      apiRequest(`/courses/${courseId}/sections`, {
        method: "POST",
        body: input,
      }),
    onSuccess: async () => {
      if (courseId !== null) {
        await queryClient.invalidateQueries({ queryKey: courseSectionsQueryKey(courseId) });
        await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      }
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) });
      }
    },
  });
}

export function useDeleteTenantSection(courseId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: number) =>
      apiRequest(`/courses/${courseId}/sections/${sectionId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      if (courseId !== null) {
        await queryClient.invalidateQueries({ queryKey: courseSectionsQueryKey(courseId) });
        await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      }
    },
  });
}

export function useCreateTenantLesson(courseId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      sectionId: number;
      title: string;
      kind: "video" | "article" | "quiz" | "code";
      duration?: number;
      order: number;
    }) =>
      apiRequest(`/courses/${courseId}/sections/${input.sectionId}/lessons`, {
        method: "POST",
        body: {
          title: input.title,
          kind: input.kind,
          duration: input.duration,
          order: input.order,
        },
      }),
    onSuccess: async () => {
      if (courseId !== null) {
        await queryClient.invalidateQueries({ queryKey: courseSectionsQueryKey(courseId) });
        await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      }
    },
  });
}

export function useDeleteTenantLesson(courseId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sectionId: number; lessonId: number }) =>
      apiRequest(`/courses/${courseId}/sections/${input.sectionId}/lessons/${input.lessonId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      if (courseId !== null) {
        await queryClient.invalidateQueries({ queryKey: courseSectionsQueryKey(courseId) });
        await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      }
    },
  });
}

export function useTenantCourseGroups() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["tenant-lms-groups", "none"] : groupsQueryKey(companyId),
    queryFn: () => apiRequest<TenantCourseGroupRecord[]>("/course-groups"),
    enabled,
  });
}

export function useCreateTenantCourseGroup() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateTenantCourseGroupInput) =>
      apiRequest<TenantCourseGroupRecord>("/course-groups", {
        method: "POST",
        body: {
          courseId: input.courseId,
          name: input.name,
          code: input.code,
          status: "planned",
          deliveryMode: "group",
          seatLimit: input.seatLimit,
          startDate: input.startDate,
        },
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: groupsQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function useAcademicClasses() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["tenant-academic-classes", "none"] : academicClassesQueryKey(companyId),
    queryFn: () => apiRequest<AcademicClassListResponse>("/academic-classes"),
    enabled,
  });
}

export function useAcademicClass(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class", "none"] : academicClassDetailQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassRecord>(`/academic-classes/${classId}`),
    enabled,
  });
}

export function useAcademicClassCourses(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class-courses", "none"] : academicClassCoursesQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassCoursesResponse>(`/academic-classes/${classId}/courses`),
    enabled,
  });
}

export function useAcademicClassTimetable(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class-timetable", "none"] : academicClassTimetableQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassTimetableResponse>(`/academic-classes/${classId}/timetable`),
    enabled,
  });
}

export function useAcademicClassAttendanceSummary(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class-attendance-summary", "none"] : academicClassAttendanceSummaryQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassAttendanceSummary>(`/academic-classes/${classId}/attendance-summary`),
    enabled,
  });
}

export function useAcademicClassStudents(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class-students", "none"] : academicClassStudentsQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassStudentsResponse>(`/academic-classes/${classId}/students`),
    enabled,
  });
}

export function useAcademicClassReport(classId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && classId !== null;

  return useQuery({
    queryKey: classId === null ? ["tenant-academic-class-report", "none"] : academicClassReportQueryKey(classId),
    queryFn: () => apiRequest<AcademicClassReport>(`/academic-classes/${classId}/report`),
    enabled,
  });
}

export function useAcademicSessionAttendance(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;

  return useQuery({
    queryKey: sessionId === null ? ["tenant-academic-session-attendance", "none"] : academicSessionAttendanceQueryKey(sessionId),
    queryFn: () => apiRequest<AcademicSessionAttendanceResponse>(`/attendance/academic-sessions/${sessionId}`),
    enabled,
  });
}

export function useMarkAcademicSessionAttendance(sessionId: number | null, classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: Array<{ studentId: number; status: "present" | "absent" | "late" | "excused"; joinedAt?: string; leftAt?: string; notes?: string }>) =>
      apiRequest(`/attendance/academic-sessions/${sessionId}/bulk`, {
        method: "POST",
        body: { rows },
      }),
    onSuccess: async () => {
      await Promise.all([
        sessionId !== null ? queryClient.invalidateQueries({ queryKey: academicSessionAttendanceQueryKey(sessionId) }) : Promise.resolve(),
        classId !== null ? queryClient.invalidateQueries({ queryKey: academicClassAttendanceSummaryQueryKey(classId) }) : Promise.resolve(),
      ]);
    },
  });
}

export function useAcademicSessionHomework(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;

  return useQuery({
    queryKey: sessionId === null ? ["tenant-academic-session-homework", "none"] : academicSessionHomeworkQueryKey(sessionId),
    queryFn: () => apiRequest<AcademicSessionHomeworkRecord[]>(`/academic-sessions/${sessionId}/homework`, {
      params: { includeUnpublished: "true" },
    }),
    enabled,
  });
}

export function useCreateAcademicSessionHomework(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademicSessionHomeworkInput) =>
      apiRequest(`/academic-sessions/${sessionId}/homework`, {
        method: "POST",
        body: {
          title: input.title,
          description: input.description ?? undefined,
          dueAt: input.dueAt ?? undefined,
          maxScore: input.maxScore ?? undefined,
          isPublished: input.isPublished ?? false,
          assignedStudentIds: input.assignedStudentIds ?? undefined,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionHomeworkQueryKey(sessionId) });
      }
    },
  });
}

export function useUpdateAcademicSessionHomework(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { homeworkId: number; patch: UpdateAcademicSessionHomeworkInput }) =>
      apiRequest(`/academic-sessions/${sessionId}/homework/${input.homeworkId}`, {
        method: "PATCH",
        body: {
          title: input.patch.title,
          description: input.patch.description ?? undefined,
          dueAt: input.patch.dueAt ?? undefined,
          maxScore: input.patch.maxScore ?? undefined,
          isPublished: input.patch.isPublished ?? undefined,
          assignedStudentIds: input.patch.assignedStudentIds ?? undefined,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionHomeworkQueryKey(sessionId) });
      }
    },
  });
}

export function useAcademicSessionHomeworkSubmissions(sessionId: number | null, homeworkId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null && homeworkId !== null;

  return useQuery({
    queryKey:
      sessionId === null || homeworkId === null
        ? ["tenant-academic-session-homework-submissions", "none"]
        : academicSessionHomeworkSubmissionsQueryKey(sessionId, homeworkId),
    queryFn: () => apiRequest<AcademicSessionHomeworkSubmissionRecord[]>(`/academic-sessions/${sessionId}/homework/${homeworkId}/submissions`),
    enabled,
  });
}

export function useReviewAcademicSessionHomeworkSubmission(sessionId: number | null, homeworkId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { submissionId: number; status: "approved" | "rejected" | "needs_revision"; score?: number | null; reviewComment?: string | null }) =>
      apiRequest(`/academic-sessions/${sessionId}/homework/${homeworkId}/submissions/${input.submissionId}`, {
        method: "PATCH",
        body: {
          status: input.status,
          score: input.score ?? undefined,
          reviewComment: input.reviewComment ?? undefined,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null && homeworkId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionHomeworkSubmissionsQueryKey(sessionId, homeworkId) });
      }
    },
  });
}

export function useAcademicSessionActivities(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;

  return useQuery({
    queryKey: sessionId === null ? ["tenant-academic-session-activities", "none"] : academicSessionActivitiesQueryKey(sessionId),
    queryFn: () => apiRequest<AcademicSessionActivityRecord[]>(`/academic-sessions/${sessionId}/activities`),
    enabled,
  });
}

export function useCreateAcademicSessionActivity(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademicSessionActivityInput) =>
      apiRequest(`/academic-sessions/${sessionId}/activities`, {
        method: "POST",
        body: {
          title: input.title,
          description: input.description ?? undefined,
          type: input.type,
          status: input.status,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionActivitiesQueryKey(sessionId) });
      }
    },
  });
}

export function useUpdateAcademicSessionActivity(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { activityId: number; patch: UpdateAcademicSessionActivityInput }) =>
      apiRequest(`/academic-sessions/${sessionId}/activities/${input.activityId}`, {
        method: "PATCH",
        body: {
          title: input.patch.title,
          description: input.patch.description ?? undefined,
          type: input.patch.type,
          status: input.patch.status,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionActivitiesQueryKey(sessionId) });
      }
    },
  });
}

export function useAcademicSessionActivityResponses(sessionId: number | null, activityId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null && activityId !== null;

  return useQuery({
    queryKey:
      sessionId === null || activityId === null
        ? ["tenant-academic-session-activity-responses", "none"]
        : academicSessionActivityResponsesQueryKey(sessionId, activityId),
    queryFn: () => apiRequest<AcademicSessionActivityResponsesResponse>(`/academic-sessions/${sessionId}/activities/${activityId}/responses`),
    enabled,
  });
}

export function useReviewAcademicSessionActivitySubmission(sessionId: number | null, activityId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { submissionId: number; status: "submitted" | "approved" | "rejected" | "needs_revision"; score?: number | null; reviewComment?: string | null }) =>
      apiRequest(`/academic-sessions/${sessionId}/activities/${activityId}/submissions/${input.submissionId}`, {
        method: "PATCH",
        body: {
          status: input.status,
          score: input.score ?? undefined,
          reviewComment: input.reviewComment ?? undefined,
        },
      }),
    onSuccess: async () => {
      if (sessionId !== null && activityId !== null) {
        await queryClient.invalidateQueries({ queryKey: academicSessionActivityResponsesQueryKey(sessionId, activityId) });
      }
    },
  });
}

export function useCreateAcademicClass() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateAcademicClassInput) =>
      apiRequest<AcademicClassRecord>("/academic-classes", {
        method: "POST",
        body: {
          name: input.name,
          code: input.code,
          gradeLevel: input.gradeLevel || undefined,
          academicYear: input.academicYear || undefined,
          status: "active",
        },
      }),
    onSuccess: async () => {
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassesQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function useAddAcademicClassStudent(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: number) =>
      apiRequest(`/academic-classes/${classId}/students`, {
        method: "POST",
        body: { studentId },
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassStudentsQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassDetailQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassAttendanceSummaryQueryKey(classId) }),
        ]);
      }
    },
  });
}

export function useRemoveAcademicClassStudent(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: number) =>
      apiRequest(`/academic-classes/${classId}/students/${studentId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassStudentsQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassDetailQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassAttendanceSummaryQueryKey(classId) }),
        ]);
      }
    },
  });
}

export function useAddAcademicClassCourse(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { courseId: number; instructorId?: number | null; term?: string | null }) =>
      apiRequest(`/academic-classes/${classId}/courses`, {
        method: "POST",
        body: {
          courseId: input.courseId,
          instructorId: input.instructorId ?? undefined,
          term: input.term ?? undefined,
          status: "active",
        },
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassCoursesQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassDetailQueryKey(classId) }),
        ]);
      }
    },
  });
}

export function useRemoveAcademicClassCourse(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classCourseId: number) =>
      apiRequest(`/academic-classes/${classId}/courses/${classCourseId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassCoursesQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassDetailQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassTimetableQueryKey(classId) }),
        ]);
      }
    },
  });
}

export function useCreateAcademicSession(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcademicSessionInput) =>
      apiRequest(`/academic-classes/${classId}/courses/${input.classCourseId}/sessions`, {
        method: "POST",
        body: {
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status ?? "scheduled",
          location: input.location ?? undefined,
          notes: input.notes ?? undefined,
          liveProvider: input.liveProvider ?? undefined,
          liveJoinUrl: input.liveJoinUrl ?? undefined,
          liveHostUrl: input.liveHostUrl ?? undefined,
          externalMeetingId: input.externalMeetingId ?? undefined,
        },
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassTimetableQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassAttendanceSummaryQueryKey(classId) }),
        ]);
      }
    },
  });
}

export function useUpdateAcademicSession(classId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sessionId: number; patch: UpdateAcademicSessionInput }) =>
      apiRequest(`/academic-sessions/${input.sessionId}`, {
        method: "PATCH",
        body: input.patch,
      }),
    onSuccess: async () => {
      if (classId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: academicClassTimetableQueryKey(classId) }),
          queryClient.invalidateQueries({ queryKey: academicClassAttendanceSummaryQueryKey(classId) }),
        ]);
      }
    },
  });
}
