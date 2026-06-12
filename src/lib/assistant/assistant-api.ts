import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

type SupportStatus = "all" | "open" | "in_progress" | "resolved";
type SupportPriority = "high" | "medium" | "low";
type SupportOwnerRole = "assistant" | "admin" | "instructor";

export type AssistantSupportReason = {
  code: "low_progress" | "missing_homework" | "open_support_note";
  count?: number;
  severity: "high" | "medium" | "low";
  route?: string | null;
};

export type AssistantSupportItem = {
  studentId: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  groupId: number | null;
  groupName: string | null;
  courseId: number | null;
  courseTitle: string | null;
  instructorId: number | null;
  instructorName: string | null;
  reasons: AssistantSupportReason[];
  lastContactAt: string | null;
  nextAction: string | null;
  supportStatus: Exclude<SupportStatus, "all"> | null;
  guardianSummary: {
    hasGuardian: boolean;
    contactAllowed: boolean;
    preferredChannel: string | null;
  };
};

export type AssistantDashboardData = {
  generatedAt: string;
  assistant: {
    id: number;
    fullName: string | null;
    email: string | null;
  };
  tenant: {
    id: number;
    name: string;
  };
  permissions: Record<string, boolean>;
  operations: {
    activeGroups: number;
    upcomingSessions: number;
    pendingEnrollments: number;
    studentsNeedingSupport: number;
    groupsWithoutInstructor: number;
    sessionsWithoutMeeting: number;
    pendingInvitations: number;
    blockedItems: number;
  };
  actionQueue: Array<{
    id: string;
    type: string;
    priority: "high" | "medium" | "low";
    i18nKey: string;
    params?: Record<string, string | number | null>;
    route?: string | null;
    ownerRole?: "assistant" | "admin" | "instructor" | "student" | "guardian";
    dueAt?: string | null;
  }>;
  groups: Array<{
    id: number;
    name: string;
    courseId: number | null;
    courseTitle: string | null;
    instructorId: number | null;
    instructorName?: string | null;
    studentCount?: number | null;
  }>;
  studentSupportQueue: AssistantSupportItem[];
};

export type AssistantSupportData = {
  items: AssistantSupportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    studentsNeedingSupport: number;
    pendingInvitations: number;
    pendingEnrollments: number;
    sessionsWithoutMeeting: number;
  };
};

export type AssistantSupportNote = {
  id: number;
  companyId: number;
  studentId: number;
  authorUserId: number | null;
  category: string;
  priority: SupportPriority;
  status: Exclude<SupportStatus, "all">;
  ownerRole: SupportOwnerRole;
  note: string;
  nextAction: string | null;
  dueAt: string | null;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageKey?: string;
};

type CreateAssistantSupportNoteInput = {
  studentId: number;
  category?: string;
  priority?: SupportPriority;
  ownerRole?: SupportOwnerRole;
  note: string;
  nextAction?: string | null;
  dueAt?: string | null;
  lastContactAt?: string | null;
};

type UpdateAssistantSupportNoteInput = {
  noteId: number;
  status?: Exclude<SupportStatus, "all">;
  priority?: SupportPriority;
  ownerRole?: SupportOwnerRole;
  note?: string;
  nextAction?: string | null;
  dueAt?: string | null;
  lastContactAt?: string | null;
};

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

function requireActiveCompanyId(companyId: number | null) {
  if (companyId === null) {
    throw new Error("Active company is required.");
  }
  return companyId;
}

function assistantDashboardQueryKey(companyId: number) {
  return ["assistant-dashboard", companyId] as const;
}

function assistantSupportQueryKey(companyId: number, status: SupportStatus, q: string) {
  return ["assistant-support", companyId, status, q] as const;
}

function assistantSupportNotesQueryKey(companyId: number, studentId: number) {
  return ["assistant-support-notes", companyId, studentId] as const;
}

export function useAssistantDashboard() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["assistant-dashboard", "none"] : assistantDashboardQueryKey(companyId),
    queryFn: () => apiRequest<AssistantDashboardData>(`/companies/${companyId}/assistant-dashboard`),
    enabled,
  });
}

export function useAssistantSupport(params?: { status?: SupportStatus; q?: string }) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const status = params?.status ?? "all";
  const q = params?.q?.trim() ?? "";
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null;

  return useQuery({
    queryKey: companyId === null ? ["assistant-support", "none"] : assistantSupportQueryKey(companyId, status, q),
    queryFn: () =>
      apiRequest<AssistantSupportData>(`/companies/${companyId}/student-support`, {
        params: {
          status,
          ...(q ? { q } : {}),
        },
      }),
    enabled,
  });
}

export function useAssistantSupportNotes(studentId: number | null) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null && studentId !== null;

  return useQuery({
    queryKey:
      companyId === null || studentId === null
        ? ["assistant-support-notes", "none"]
        : assistantSupportNotesQueryKey(companyId, studentId),
    queryFn: () => apiRequest<AssistantSupportNote[]>(`/companies/${companyId}/student-support/${studentId}/notes`),
    enabled,
  });
}

export function useCreateAssistantSupportNote() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateAssistantSupportNoteInput) => {
      const activeCompanyId = requireActiveCompanyId(companyId);
      return apiRequest<AssistantSupportNote>(`/companies/${activeCompanyId}/student-support/notes`, {
        method: "POST",
        body: input,
      });
    },
    onSuccess: async (_, variables) => {
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["assistant-dashboard", companyId] }),
          queryClient.invalidateQueries({ queryKey: ["assistant-support", companyId] }),
          queryClient.invalidateQueries({ queryKey: assistantSupportNotesQueryKey(companyId, variables.studentId) }),
        ]);
      }
    },
  });
}

export function useUpdateAssistantSupportNote(studentId: number | null) {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ noteId, ...body }: UpdateAssistantSupportNoteInput) => {
      const activeCompanyId = requireActiveCompanyId(companyId);
      return apiRequest<AssistantSupportNote>(`/companies/${activeCompanyId}/student-support/notes/${noteId}`, {
        method: "PATCH",
        body,
      });
    },
    onSuccess: async () => {
      if (companyId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["assistant-dashboard", companyId] }),
          queryClient.invalidateQueries({ queryKey: ["assistant-support", companyId] }),
          ...(studentId !== null ? [queryClient.invalidateQueries({ queryKey: assistantSupportNotesQueryKey(companyId, studentId) })] : []),
        ]);
      }
    },
  });
}
