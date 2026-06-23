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
  coverImageUrl?: string | null;
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
  courseType?: "offline" | "online_live";
};

export type UpdateTenantCourseInput = {
  courseId: number;
  patch: {
    title?: string;
    subtitle?: string | null;
    description?: string | null;
    status?: string | null;
    isPublished?: boolean;
    courseType?: "video" | "offline" | "online_live" | string | null;
  };
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
  scheduleBlocks?: Array<{ day: string; startTime: string; endTime: string }> | null;
  meetingProvider?: string | null;
  meetingUrl?: string | null;
  instructor?: { id: number; fullName?: string | null; email?: string | null } | null;
};

export type CreateTenantCourseGroupInput = {
  courseId: number;
  name: string;
  code: string;
  seatLimit?: number;
  startDate?: string;
  endDate?: string;
};

export type CreateIndividualCourseGroupInput = {
  courseId: number;
  studentId: number;
  name?: string;
  instructorId?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  scheduleBlocks?: Array<{ day: string; startTime: string; endTime: string }>;
  createFirstSession?: boolean;
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
  isMakeup?: boolean;
  makeupForSessionId?: number | null;
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
  isMakeup?: boolean;
  makeupForSessionId?: number | null;
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

export type ActivityType = "discussion" | "exercise" | "quiz" | "group_work" | "vocabulary" | "fill_blank" | "word_match" | "listening" | "writing_correction";

export type VocabularyPayload = {
  words: Array<{ term: string; definition: string; exampleSentence?: string; translation?: string }>;
};

export type FillBlankPayload = {
  sentences: Array<{ template: string; answers: string[] }>;
};

export type WordMatchPayload = {
  pairs: Array<{ term: string; match: string }>;
};

export type ListeningPayload = {
  audioUrl: string;
  questions: Array<{ prompt: string; answer?: string }>;
};

export type WritingCorrectionPayload = {
  prompt: string;
  rubric?: string | null;
};

export type ActivityPayload = VocabularyPayload | FillBlankPayload | WordMatchPayload | ListeningPayload | WritingCorrectionPayload | null;

export type LessonPlanTemplateActivity = {
  type: ActivityType;
  title: string;
  description?: string | null;
  payload?: ActivityPayload;
};

export type LessonPlanTemplateRecord = {
  id: number;
  companyId: number;
  authorId: number;
  name: string;
  activities: LessonPlanTemplateActivity[];
  createdAt: string;
  updatedAt: string;
};

export type AcademicSessionActivityRecord = {
  id: number;
  academicSessionId: number;
  type: ActivityType;
  title: string;
  description: string | null;
  status: "planned" | "active" | "done";
  position: number;
  payload?: ActivityPayload;
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
  type: ActivityType;
  status: "planned" | "active" | "done";
  payload?: ActivityPayload;
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

export function useInstructorCourses() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["instructor-my-courses"],
    queryFn: () =>
      apiRequest<TenantCourseListResponse>("/courses/instructor/my-courses?limit=50"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useUpdateTenantLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      lessonId,
      patch,
    }: {
      courseId: number;
      sectionId: number;
      lessonId: number;
      patch: {
        title?: string;
        content?: string | null;
        kind?: "video" | "article" | "quiz" | "code";
        order?: number;
        isPublished?: boolean;
      };
    }) =>
      apiRequest(
        `/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
        { method: "PATCH", body: patch },
      ),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseSectionsQueryKey(courseId) });
    },
  });
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
          courseType: input.courseType ?? "offline",
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

export function useUploadCourseCover() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ courseId, file }: { courseId: number; file: File }) => {
      const fd = new FormData();
      fd.append("cover", file);
      return apiRequest<{ coverImageUrl: string }>(`/courses/${courseId}/upload-cover`, {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) });
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

export function useUpdateTenantCourse() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ courseId, patch }: UpdateTenantCourseInput) =>
      apiRequest<TenantCourseRecord>(`/courses/${courseId}`, {
        method: "PATCH",
        body: {
          title: patch.title,
          subtitle: patch.subtitle ?? undefined,
          description: patch.description ?? undefined,
          courseType: patch.courseType ?? undefined,
        },
      }),
    onSuccess: async (_data, { courseId }) => {
      await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function useUpdateTenantCourseStatus() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ courseId, status }: { courseId: number; status: "pending" | "approved" | "rejected" }) =>
      apiRequest<TenantCourseRecord>(`/courses/${courseId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: async (_data, { courseId }) => {
      await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function usePublishTenantCourse() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ courseId }: { courseId: number }) =>
      apiRequest<TenantCourseRecord>(`/courses/${courseId}/publish`, {
        method: "PATCH",
      }),
    onSuccess: async (_data, { courseId }) => {
      await queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) }),
          queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] }),
        ]);
      }
    },
  });
}

export function useTenantCourseSections(courseId: number | null, courseType?: string | null) {
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
      apiRequest<TenantSectionRecord>(`/courses/${courseId}/sections`, {
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
          endDate: input.endDate,
        },
      }),
    onSuccess: async (_, input) => {
      await Promise.all([
        companyId !== null
          ? queryClient.invalidateQueries({ queryKey: groupsQueryKey(companyId) })
          : Promise.resolve(),
        companyId !== null
          ? queryClient.invalidateQueries({ queryKey: ["company-admin-dashboard", companyId] })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["tenant-lms-groups-by-course", input.courseId] }),
      ]);
    },
  });
}

export function useCreateIndividualCourseGroup() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateIndividualCourseGroupInput) =>
      apiRequest<TenantCourseGroupRecord>("/course-groups/individual", {
        method: "POST",
        body: input,
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

export type CourseGroupStudentRecord = {
  id: number;
  userId: number;
  fullName: string | null;
  email: string | null;
  phoneNumber?: string | null;
  courseId: number;
  groupId: number;
  enrolledAt: string | null;
  progressPercent: number;
  completed: boolean;
};

export type CourseGroupStudentsResponse = {
  items: CourseGroupStudentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  group: { id: number; courseId: number; name: string; code: string };
};

export type CourseSessionRecord = {
  id: number;
  courseId: number;
  groupId: number;
  sessionIndex: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "completed" | "cancelled";
  location: string | null;
  liveProvider: string | null;
  liveJoinUrl: string | null;
  recordingUrl: string | null;
  isMakeup?: boolean;
  makeupForSessionId?: number | null;
  activities: Array<{ id: number; title: string; type: string; status: string }>;
};

function courseGroupQueryKey(groupId: number) {
  return ["tenant-lms-group", groupId] as const;
}

function courseGroupStudentsQueryKey(groupId: number) {
  return ["tenant-lms-group-students", groupId] as const;
}

function courseGroupSessionsQueryKey(groupId: number) {
  return ["tenant-lms-group-sessions", groupId] as const;
}

export function useCourseGroup(groupId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && groupId !== null;
  return useQuery({
    queryKey: groupId === null ? ["tenant-lms-group", "none"] : courseGroupQueryKey(groupId),
    queryFn: () => apiRequest<TenantCourseGroupRecord>(`/course-groups/${groupId}`),
    enabled,
  });
}

export function useCourseGroupStudents(groupId: number | null, opts?: { page?: number; limit?: number; q?: string }) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && groupId !== null;
  return useQuery({
    queryKey: groupId === null ? ["tenant-lms-group-students", "none"] : [...courseGroupStudentsQueryKey(groupId), opts],
    queryFn: () =>
      apiRequest<CourseGroupStudentsResponse>(`/course-groups/${groupId}/students`, {
        params: opts as Record<string, string | number | boolean | null | undefined>,
      }),
    enabled,
  });
}

export function useCourseGroupSessions(groupId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && groupId !== null;
  return useQuery({
    queryKey: groupId === null ? ["tenant-lms-group-sessions", "none"] : courseGroupSessionsQueryKey(groupId),
    queryFn: () => apiRequest<CourseSessionRecord[]>(`/group-sessions?groupId=${groupId}`),
    enabled,
  });
}

export type CourseGroupProgressRecord = {
  sessions: Array<{
    sessionId: number;
    title: string;
    startsAt: string;
    status: "scheduled" | "completed" | "cancelled";
    isMakeup: boolean;
    homeworkAssigned: number;
    homeworkSubmitted: number;
    averageScore: number | null;
    activitiesTotal: number;
  }>;
  totals: {
    homeworkAssigned: number;
    homeworkSubmitted: number;
    activitiesTotal: number;
  };
};

function courseGroupProgressQueryKey(groupId: number) {
  return ["tenant-lms-group-progress", groupId] as const;
}

function groupSessionDetailQueryKey(sessionId: number) {
  return ["tenant-group-session-detail", sessionId] as const;
}

function groupSessionAttendanceQueryKey(sessionId: number) {
  return ["tenant-group-session-attendance", sessionId] as const;
}

function groupSessionHomeworkQueryKey(sessionId: number) {
  return ["tenant-group-session-homework", sessionId] as const;
}

export function useCourseGroupProgress(groupId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && groupId !== null;
  return useQuery({
    queryKey: groupId === null ? ["tenant-lms-group-progress", "none"] : courseGroupProgressQueryKey(groupId),
    queryFn: () => apiRequest<CourseGroupProgressRecord>(`/course-groups/${groupId}/progress`),
    enabled,
  });
}

export function useCourseGroupsByCourse(courseId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null;
  return useQuery({
    queryKey: courseId === null ? ["tenant-lms-groups-by-course", "none"] : (["tenant-lms-groups-by-course", courseId] as const),
    queryFn: () => apiRequest<TenantCourseGroupRecord[]>(`/course-groups?courseId=${courseId}`),
    enabled,
  });
}

export type CourseStudentRecord = {
  userId: number;
  email: string;
  fullName: string | null;
  enrolledAt: string;
  enrollmentStatus: string;
};

export function useCourseEnrolledStudents(courseId: number | null) {
  return useQuery({
    queryKey: ["course-enrolled-students", courseId] as const,
    queryFn: () => apiRequest<CourseStudentRecord[]>(`/enrollments/courses/${courseId}/students`),
    enabled: courseId !== null,
  });
}

export type CourseCertificateEligibilitySnapshot = {
  mode?: "delivery" | "progress" | string | null;
  attendance?: { percent?: number | null } | null;
  homework?: { percent?: number | null } | null;
  activities?: { percent?: number | null } | null;
} | null;

export type CourseStudentWorkspaceRecord = {
  id: number;
  email: string | null;
  fullName: string | null;
  phoneNumber?: string | null;
  enrolledAt: string;
  progressPercent?: number | null;
  completed?: boolean;
  certificateStatus?: "pending_approval" | "issued" | "rejected" | "revoked" | null;
  certificatePublicId?: string | null;
  certificateDownloadUrl?: string | null;
  certificateVerificationUrl?: string | null;
  certificateEligibility?: CourseCertificateEligibilitySnapshot;
};

export type CourseStudentsWorkspaceResponse = {
  students: CourseStudentWorkspaceRecord[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  course?: {
    id?: number;
    title?: string | null;
    studentCount?: number | null;
    lessonCount?: number | null;
    totalPages?: number | null;
  } | null;
};

export function useCourseStudentsWorkspace(
  courseId: number | null,
  params?: { page?: number; limit?: number; q?: string; progressGte?: number; progressLte?: number },
) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && courseId !== null;
  return useQuery({
    queryKey: ["course-students-workspace", courseId, params?.page ?? 1, params?.limit ?? 20, params?.q ?? "", params?.progressGte ?? "", params?.progressLte ?? ""] as const,
    queryFn: () =>
      apiRequest<CourseStudentsWorkspaceResponse>(`/courses/${courseId}/students`, {
        params: params as Record<string, string | number | boolean | null | undefined>,
      }),
    enabled,
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: (input: { userId: number; courseId: number; groupId?: number }) =>
      apiRequest<{ ok: boolean }>("/enrollments/enroll", { method: "POST", body: input }),
    onSuccess: (_, { courseId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-enrolled-students", courseId] });
      queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) });
      }
      if (groupId !== undefined) {
        queryClient.invalidateQueries({ queryKey: courseGroupStudentsQueryKey(groupId) });
      }
    },
  });
}

export function useUnenrollFromCourse() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: ({ courseId, userId }: { courseId: number; userId: number }) =>
      apiRequest<{ ok: boolean }>(`/enrollments/${courseId}/unenroll/${userId}`, { method: "DELETE" }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-enrolled-students", courseId] });
      queryClient.invalidateQueries({ queryKey: courseDetailQueryKey(courseId) });
      if (companyId !== null) {
        queryClient.invalidateQueries({ queryKey: coursesQueryKey(companyId) });
      }
    },
  });
}

export function useRemoveStudentFromGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      apiRequest<{ ok: boolean }>(`/enrollments/groups/${groupId}/students/${userId}`, { method: "DELETE" }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: courseGroupStudentsQueryKey(groupId) });
    },
  });
}

export type CreateCourseSessionInput = {
  groupId: number;
  sessionIndex: number;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  liveJoinUrl?: string;
  notes?: string;
};

export type UpdateCourseSessionInput = {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  status?: "scheduled" | "completed" | "cancelled";
  notes?: string | null;
  isMakeup?: boolean;
  makeupForSessionId?: number | null;
};

export function useCreateCourseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseSessionInput) =>
      apiRequest<CourseSessionRecord>("/group-sessions", {
        method: "POST",
        body: input,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseGroupSessionsQueryKey(variables.groupId) });
    },
  });
}

export function useUpdateCourseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, patch }: { sessionId: number; groupId: number; patch: UpdateCourseSessionInput }) =>
      apiRequest<CourseSessionRecord>(`/group-sessions/${sessionId}`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (_, { sessionId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: courseGroupSessionsQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: courseGroupProgressQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: groupSessionDetailQueryKey(sessionId) });
    },
  });
}

// ---------- Group session detail types & hooks ----------

export type GroupSessionDetailRecord = CourseSessionRecord & {
  notes?: string | null;
  groupDeliveryMode?: "group" | "individual";
  group?: TenantCourseGroupRecord | null;
  materials?: Array<{ title: string; url: string; storageKey: string | null; lessonId: number | null }>;
};

export type GroupSessionAttendanceRecord = {
  id: number;
  userId: number;
  sessionId: number | null;
  status: "present" | "absent" | "late" | "excused";
  joinedAt: string | null;
  leftAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupSessionAttendanceResponse = {
  items: GroupSessionAttendanceRecord[];
  total: number;
};

export type GroupSessionHomeworkRecord = {
  id: number;
  sessionId: number;
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

export type GroupSessionHomeworkInput = {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  maxScore?: number | null;
  isPublished?: boolean;
  assignedStudentIds?: number[];
};

export function useGroupSessionDetail(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;
  return useQuery({
    queryKey: sessionId === null ? ["tenant-group-session-detail", "none"] : groupSessionDetailQueryKey(sessionId),
    queryFn: () => apiRequest<GroupSessionDetailRecord>(`/group-sessions/${sessionId}`),
    enabled,
  });
}

export function useGroupSessionAttendance(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;
  return useQuery({
    queryKey: sessionId === null ? ["tenant-group-session-attendance", "none"] : groupSessionAttendanceQueryKey(sessionId),
    queryFn: () => apiRequest<GroupSessionAttendanceResponse>(`/attendance/sessions/${sessionId}`),
    enabled,
  });
}

export function useMarkGroupSessionAttendance(sessionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<{ studentId: number; status: "present" | "absent" | "late" | "excused"; notes?: string }>) =>
      apiRequest(`/attendance/sessions/${sessionId}/bulk`, {
        method: "POST",
        body: { rows },
      }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: groupSessionAttendanceQueryKey(sessionId) });
      }
    },
  });
}

export function useGroupSessionHomework(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;
  return useQuery({
    queryKey: sessionId === null ? ["tenant-group-session-homework", "none"] : groupSessionHomeworkQueryKey(sessionId),
    queryFn: () => apiRequest<GroupSessionHomeworkRecord[]>(`/group-sessions/${sessionId}/homework`, {
      params: { includeUnpublished: "true" },
    }),
    enabled,
  });
}

export function useCreateGroupSessionHomework(sessionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupSessionHomeworkInput) =>
      apiRequest(`/group-sessions/${sessionId}/homework`, { method: "POST", body: input }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: groupSessionHomeworkQueryKey(sessionId) });
      }
    },
  });
}

export function useUpdateGroupSessionHomework(sessionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ homeworkId, patch }: { homeworkId: number; patch: GroupSessionHomeworkInput }) =>
      apiRequest(`/group-sessions/${sessionId}/homework/${homeworkId}`, { method: "PATCH", body: patch }),
    onSuccess: async () => {
      if (sessionId !== null) {
        await queryClient.invalidateQueries({ queryKey: groupSessionHomeworkQueryKey(sessionId) });
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

export function useAcademicSession(sessionId: number | null) {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && sessionId !== null;

  return useQuery({
    queryKey: sessionId === null ? ["tenant-academic-session", "none"] : ["tenant-academic-session", sessionId],
    queryFn: () => apiRequest<AcademicSessionRecord>(`/academic-sessions/${sessionId}`),
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
          payload: input.payload ?? undefined,
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
          payload: input.patch.payload ?? undefined,
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

function lessonPlanTemplatesQueryKey(companyId: number) {
  return ["lesson-plan-templates", companyId] as const;
}

export function useLessonPlanTemplates() {
  const companyId = useActiveCompanyId();
  return useQuery({
    queryKey: companyId !== null ? lessonPlanTemplatesQueryKey(companyId) : (["lesson-plan-templates-disabled"] as const),
    queryFn: () => apiRequest<LessonPlanTemplateRecord[]>("/lesson-plan-templates"),
    enabled: companyId !== null,
  });
}

export function useCreateLessonPlanTemplate() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: (input: { name: string; activities: LessonPlanTemplateActivity[] }) =>
      apiRequest<LessonPlanTemplateRecord>("/lesson-plan-templates", { method: "POST", body: input }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: lessonPlanTemplatesQueryKey(companyId) });
      }
    },
  });
}

export function useDeleteLessonPlanTemplate() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ deleted: boolean }>(`/lesson-plan-templates/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: lessonPlanTemplatesQueryKey(companyId) });
      }
    },
  });
}

// ── Trial Requests ────────────────────────────────────────────────────────────

export type TrialRequestStatus = "pending" | "approved" | "rejected" | "completed";

export type TrialRequestRecord = {
  id: number;
  companyId: number | null;
  courseId: number | null;
  studentName: string;
  studentEmail: string;
  parentName: string | null;
  parentEmail: string | null;
  preferredDate: string | null;
  message: string | null;
  status: TrialRequestStatus;
  assignedInstructorId: number | null;
  adminNotes: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTrialRequestInput = {
  studentName: string;
  studentEmail: string;
  parentName?: string | null;
  parentEmail?: string | null;
  preferredDate?: string | null;
  message?: string | null;
  courseId?: number | null;
};

export type UpdateTrialRequestInput = {
  status?: TrialRequestStatus;
  assignedInstructorId?: number | null;
  adminNotes?: string | null;
  scheduledAt?: string | null;
};

function trialRequestsQueryKey(companyId: number | null, status?: string) {
  return ["trial-requests", companyId, status ?? "all"] as const;
}

export function useTrialRequests(status?: string) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend";
  return useQuery({
    queryKey: trialRequestsQueryKey(companyId, status),
    queryFn: () =>
      apiRequest<{ items: TrialRequestRecord[]; total: number; page: number; limit: number }>(
        "/trial-requests",
        { params: { status, limit: "50" } as Record<string, string> },
      ),
    enabled,
  });
}

export function useCreateTrialRequest() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: (input: CreateTrialRequestInput) =>
      apiRequest<TrialRequestRecord>("/trial-requests", { method: "POST", body: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trialRequestsQueryKey(companyId) });
    },
  });
}

export function useUpdateTrialRequest() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: (input: { id: number; patch: UpdateTrialRequestInput }) =>
      apiRequest<TrialRequestRecord>(`/trial-requests/${input.id}`, { method: "PATCH", body: input.patch }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trialRequestsQueryKey(companyId) });
    },
  });
}

// ─── Group Message Threads ───────────────────────────────────────────────────

export type GroupMessageThreadRecord = {
  id: number;
  groupId: number;
  parentId: number;
  instructorId: number | null;
  companyId: number | null;
  status: "active" | "archived";
  lastMessageAt: string | null;
  createdAt: string;
};

export type GroupMessageRecord = {
  id: number;
  threadId: number;
  senderId: number;
  authorRole: "parent" | "instructor";
  content: string;
  createdAt: string;
};

const groupThreadsQueryKey = (companyId: number | null) =>
  ["group-message-threads", companyId] as const;

const groupMessagesQueryKey = (threadId: number) =>
  ["group-messages", threadId] as const;

export function useGroupMessageThread(groupId: number, instructorId?: number | null) {
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: () =>
      apiRequest<GroupMessageThreadRecord>("/group-message-threads/start", {
        params: {
          groupId: String(groupId),
          ...(instructorId != null ? { instructorId: String(instructorId) } : {}),
        } as Record<string, string>,
        method: "POST",
      }),
    onSuccess: async (data) => data,
  });
}

export function useGroupThreads() {
  const companyId = useActiveCompanyId();
  return useQuery({
    queryKey: groupThreadsQueryKey(companyId),
    queryFn: () =>
      apiRequest<GroupMessageThreadRecord[]>("/group-message-threads"),
  });
}

export function useGroupMessages(threadId: number | null) {
  return useQuery({
    queryKey: groupMessagesQueryKey(threadId ?? 0),
    queryFn: () =>
      apiRequest<{ thread: GroupMessageThreadRecord; messages: GroupMessageRecord[] }>(
        `/group-message-threads/${threadId}/messages`,
      ),
    enabled: threadId != null && threadId > 0,
    refetchInterval: 10_000,
  });
}

export function useSendGroupMessage(threadId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; authorRole: "parent" | "instructor" }) =>
      apiRequest<GroupMessageRecord>(`/group-message-threads/${threadId}/messages`, {
        method: "POST",
        body: input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupMessagesQueryKey(threadId) });
    },
  });
}
