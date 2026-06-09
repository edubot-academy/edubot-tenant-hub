import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export type GradingQueueItem = {
  submissionId: number;
  kind: "homework" | "activity";
  taskId: number;
  taskTitle: string;
  activityType?: string;
  sessionId: number;
  sessionTitle: string;
  courseId: number;
  courseTitle: string;
  groupId: number;
  studentId: number;
  studentName: string | null;
  studentEmail: string | null;
  submittedAt: string;
  status: "submitted" | "approved" | "rejected" | "needs_revision";
  score: number | null;
  reviewComment: string | null;
  hasAttachment: boolean;
  hasText: boolean;
};

export type GradingQueueResponse = {
  items: GradingQueueItem[];
  total: number;
  page: number;
  limit: number;
};

export type AssignmentItem = {
  id: number;
  kind: "homework";
  title: string;
  description: string | null;
  isPublished: boolean;
  dueAt: string | null;
  maxScore: number | null;
  sessionId: number;
  sessionTitle: string;
  courseId: number;
  courseTitle: string;
  groupId: number;
  groupName: string;
  submittedCount: number;
  pendingCount: number;
};

export type AssignmentsResponse = {
  items: AssignmentItem[];
  total: number;
  page: number;
  limit: number;
};

export function gradingQueueQueryKey(
  companyId: number,
  params?: { page?: number; limit?: number; status?: string; courseId?: number },
) {
  return ["instructor-grading-queue", companyId, params] as const;
}

export function assignmentsQueryKey(
  companyId: number,
  params?: { page?: number; limit?: number; courseId?: number; groupId?: number },
) {
  return ["instructor-assignments", companyId, params] as const;
}

export function useInstructorGradingQueue(params?: {
  page?: number;
  limit?: number;
  status?: string;
  courseId?: number;
}) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["instructor-grading-queue", "none"] : gradingQueueQueryKey(companyId, params),
    queryFn: () =>
      apiRequest<GradingQueueResponse>(`/companies/${companyId}/grading-queue`, {
        params: params,
      }),
    enabled,
  });
}

export function useInstructorAssignments(params?: {
  page?: number;
  limit?: number;
  courseId?: number;
  groupId?: number;
}) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["instructor-assignments", "none"] : assignmentsQueryKey(companyId, params),
    queryFn: () =>
      apiRequest<AssignmentsResponse>(`/companies/${companyId}/assignments`, {
        params: params,
      }),
    enabled,
  });
}

export type FeedbackDraftOutput = {
  feedback: string;
  whatWentWell: string[];
  needsImprovement: string[];
  suggestedScore: number | null;
  nextStep: string;
};

export type ReviewSubmissionPayload = {
  kind: "homework" | "activity";
  sessionId: number;
  taskId: number;
  submissionId: number;
  status: "approved" | "rejected" | "needs_revision";
  score?: number;
  reviewComment?: string;
};

export function useReviewSubmission() {
  const qc = useQueryClient();
  const companyId = useActiveCompanyId();
  return useMutation({
    mutationFn: ({ kind, sessionId, taskId, submissionId, status, score, reviewComment }: ReviewSubmissionPayload) => {
      const path =
        kind === "homework"
          ? `/group-sessions/${sessionId}/homework/${taskId}/submissions/${submissionId}`
          : `/group-sessions/${sessionId}/activities/${taskId}/submissions/${submissionId}`;
      return apiRequest<{ ok: boolean }>(path, { method: "PATCH", body: { status, score, reviewComment } });
    },
    onSuccess: () => {
      if (companyId !== null) {
        qc.invalidateQueries({ queryKey: gradingQueueQueryKey(companyId) });
      }
    },
  });
}

export function useGenerateFeedbackDraft() {
  return useMutation({
    mutationFn: ({
      submissionId,
      submissionType,
    }: {
      submissionId: number;
      submissionType: "homework" | "session_activity";
    }) =>
      apiRequest<{ generationId: number; output: FeedbackDraftOutput }>(
        `/ai-lms/submissions/${submissionId}/feedback-draft`,
        { body: { submissionType, includeScoreSuggestion: true } },
      ),
  });
}

export type InstructorStudentItem = {
  enrollmentId: number;
  userId: number;
  fullName: string | null;
  email: string | null;
  groupId: number;
  groupName: string | null;
  courseId: number;
  courseTitle: string | null;
  enrolledAt: string | null;
  progressPercent: number;
  completed: boolean;
};

export type InstructorStudentsResponse = {
  items: InstructorStudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function useInstructorStudents(params?: {
  page?: number;
  limit?: number;
  groupId?: number;
  q?: string;
}) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null
      ? ["instructor-students", "none"]
      : (["instructor-students", companyId, params] as const),
    queryFn: () =>
      apiRequest<InstructorStudentsResponse>(`/companies/${companyId}/instructor-students`, {
        params: params,
      }),
    enabled,
  });
}
