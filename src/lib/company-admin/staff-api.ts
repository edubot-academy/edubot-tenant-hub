import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";
import { useRole } from "@/lib/roles";

export type CompanyStaffRole = "owner" | "company_admin" | "assistant" | "instructor" | "student" | "parent";

export type MemberPermissions = {
  canCreateCourses?: boolean;
  canCreateGroups?: boolean;
};

export type CompanyMemberRecord = {
  id: number;
  userId: number;
  companyId: number;
  role: CompanyStaffRole;
  status: "invited" | "active" | "suspended";
  invitedByUserId: number | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string | null;
  email: string | null;
  permissions: MemberPermissions | null;
  invitation: {
    status: "completed" | "expired" | "pending" | "not_started";
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean | null;
    sentAt: string | null;
  } | null;
  onboarding: {
    status: "completed" | "expired" | "pending" | "not_started";
    setupRequired: boolean;
    setupCompleted: boolean;
    setupCompletedAt: string | null;
    setupLink: string | null;
    expiresAt: string | null;
    emailSent: boolean | null;
  };
};

export type MemberProfileCourse = {
  courseId: number;
  courseTitle: string | null;
  groupCount: number;
  studentCount: number;
  avgProgress: number;
};

// Groups the instructor teaches
export type InstructorManagedGroup = {
  groupId: number;
  groupName: string;
  status: string;
  courseId: number;
  courseTitle: string | null;
  courseType: string | null;
  instructorId: number | null;
  instructorName: string | null;
  studentCount: number;
  avgProgress: number;
  completedStudents: number;
  atRiskStudents: number;
};

// Groups the student is enrolled in
export type StudentEnrolledGroup = {
  groupId: number;
  groupName: string;
  courseId: number;
  courseTitle: string | null;
  instructorId: number | null;
  instructorName: string | null;
  progressPercent: number;
  completed: boolean;
  atRisk: boolean;
  enrolledAt: string | null;
};

export type AttendanceSummary = {
  total: number;
  attended: number;
  missed: number;
  late: number;
  excused: number;
  rate: number | null;
};

export type HomeworkSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  pending: number;
  missing: number;
  approvalRate: number | null;
};

export type MemberProfile = {
  generatedAt: string;
  person: {
    id: number;
    fullName: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string | null;
    roles: string[];
    title: string | null;
    avatar: string | null;
    bio: string | null;
    createdAt: string;
    permissions: MemberPermissions | null;
  };
  summary: {
    avgProgress: number;
    completed: number;
    atRisk: number;
    courses: number;
    groups: number;
    students: number | null;
  };
  courses: MemberProfileCourse[];
  groups: InstructorManagedGroup[] | StudentEnrolledGroup[];
  students: Array<{
    studentId: number;
    fullName: string | null;
    email: string | null;
    groupId: number | null;
    groupName: string | null;
    courseId: number | null;
    courseTitle: string | null;
    progressPercent: number;
    completed: boolean;
    atRisk: boolean;
  }>;
  attendance: AttendanceSummary | null;
  homework: HomeworkSummary | null;
};

type CompanyMemberMutationResult = {
  ok?: boolean;
  messageKey?: string;
  userId?: number;
  onboarding?: { setupLink: string; expiresAt: string; emailSent: boolean } | null;
};

export type InviteCompanyMemberInput = {
  fullName: string;
  email: string;
  role: "owner" | "company_admin" | "assistant" | "instructor" | "student" | "parent";
  sendEmail?: boolean;
};

type SetCompanyMemberRoleInput = {
  userId: number;
  role: "owner" | "company_admin" | "assistant" | "instructor" | "student" | "parent";
  mode?: "replace" | "add";
  fromRole?: CompanyStaffRole;
};

type RemoveCompanyMemberInput = {
  userId: number;
  role?: CompanyStaffRole;
};

type ResendCompanyInvitationInput = {
  userId: number;
  sendEmail?: boolean;
};

function companyStaffQueryKey(companyId: number, roles?: CompanyStaffRole[]) {
  return roles && roles.length > 0 ? ["company-staff", companyId, roles.join(",")] as const : ["company-staff", companyId] as const;
}

function memberProfileQueryKey(companyId: number, userId: number) {
  return ["member-profile", companyId, userId] as const;
}

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

export function useCompanyStaff(roles?: CompanyStaffRole[]) {
  const { context } = useAppContext();
  const { role } = useRole();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null && (role === "owner" || role === "company_admin" || role === "instructor");

  return useQuery({
    queryKey: companyId === null ? ["company-staff", "none"] : companyStaffQueryKey(companyId, roles),
    queryFn: () => {
      const params = roles && roles.length > 0 ? `?roles=${roles.join(",")}` : "";
      return apiRequest<CompanyMemberRecord[]>(`/companies/${companyId}/members${params}`);
    },
    enabled,
  });
}

export function useMemberProfile(userId: number | null) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null && userId !== null;

  return useQuery({
    queryKey: companyId !== null && userId !== null ? memberProfileQueryKey(companyId, userId) : ["member-profile", "none"],
    queryFn: () => apiRequest<MemberProfile>(`/companies/${companyId}/people/${userId}/profile`),
    enabled,
  });
}

export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: MemberPermissions }) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<{ ok: boolean; permissions: MemberPermissions }>(`/companies/${companyId}/members/${userId}/permissions`, {
        method: "PATCH",
        body: permissions,
      });
    },
    onSuccess: (_, { userId }) => {
      if (companyId !== null) {
        queryClient.invalidateQueries({ queryKey: memberProfileQueryKey(companyId, userId) });
        queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useInviteCompanyMember() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: InviteCompanyMemberInput) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/invitations`, {
        method: "POST",
        body: input,
      });
    },
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useSetCompanyMemberRole() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: SetCompanyMemberRoleInput) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/members/${input.userId}`, {
        method: "PATCH",
        body: { role: input.role, mode: input.mode, fromRole: input.fromRole },
      });
    },
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useRemoveCompanyMember() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: RemoveCompanyMemberInput) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/members/${input.userId}`, {
        method: "DELETE",
        params: input.role ? { role: input.role } : undefined,
      });
    },
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export type StudentGuardianRecord = {
  id: number;
  companyId: number;
  studentId: number;
  guardianUserId: number | null;
  fullName: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  preferredChannel: string | null;
  canReceiveProgressUpdates: boolean;
  canReceiveAttendanceUpdates: boolean;
  canReceiveHomeworkUpdates: boolean;
  consentStatus: "pending" | "granted" | "revoked";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudentGuardianInput = {
  studentId: number;
  fullName: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: string | null;
  notes?: string | null;
  sendInvite?: boolean;
  sendEmail?: boolean;
};

export type CreateStudentGuardianResult = StudentGuardianRecord & {
  messageKey: string;
  onboarding: { setupLink: string; expiresAt: string; emailSent: boolean } | null;
};

export type GuardianChildRecord = StudentGuardianRecord & {
  student: { id: number; fullName: string | null; email: string | null } | null;
};

export function useGuardianChildren(guardianUserId: number | null) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null && guardianUserId !== null;

  return useQuery({
    queryKey: companyId !== null && guardianUserId !== null ? ["guardian-children", companyId, guardianUserId] : ["guardian-children", "none"],
    queryFn: () => apiRequest<GuardianChildRecord[]>(`/companies/${companyId}/guardians/${guardianUserId}/students`),
    enabled,
  });
}

export function useStudentGuardians(studentId: number | null) {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  const enabled = isBackendApiEnabled() && context.mode === "backend" && companyId !== null && studentId !== null;

  return useQuery({
    queryKey: companyId !== null && studentId !== null ? ["student-guardians", companyId, studentId] : ["student-guardians", "none"],
    queryFn: () => apiRequest<StudentGuardianRecord[]>(`/companies/${companyId}/students/${studentId}/guardians`),
    enabled,
  });
}

export function useCreateStudentGuardian() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CreateStudentGuardianInput) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<CreateStudentGuardianResult>(`/companies/${companyId}/students/guardians`, {
        method: "POST",
        body: input,
      });
    },
    onSuccess: (_, { studentId }) => {
      if (companyId !== null) {
        queryClient.invalidateQueries({ queryKey: ["student-guardians", companyId, studentId] });
        queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}

export function useResendCompanyInvitation() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: ResendCompanyInvitationInput) => {
      if (companyId === null) return Promise.reject(new Error("No active company"));
      return apiRequest<CompanyMemberMutationResult>(`/companies/${companyId}/invitations/${input.userId}/resend`, {
        method: "POST",
        body: { sendEmail: input.sendEmail ?? true },
      });
    },
    onSuccess: async () => {
      if (companyId !== null) {
        await queryClient.invalidateQueries({ queryKey: companyStaffQueryKey(companyId) });
      }
    },
  });
}
