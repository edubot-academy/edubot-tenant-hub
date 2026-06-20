import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";

export type EnglishLevel = "A0" | "A1" | "A2" | "B1" | "B2";
export type EnglishSkill = "grammar" | "vocabulary" | "reading" | "communication";
export type StudentGoal =
  | "daily_life"
  | "study_abroad"
  | "ielts_toefl"
  | "work_career"
  | "school_support";

export type LocalizedText = { ky?: string; ru?: string; en: string };
export type AssessmentOptionInput = { text: LocalizedText; isCorrect: boolean; order?: number };

export interface AssessmentOption {
  id: number;
  text: LocalizedText;
  isCorrect?: boolean;
  order: number;
}

export interface AssessmentQuestion {
  id: number;
  skill: EnglishSkill;
  level: EnglishLevel;
  difficulty: number;
  question: LocalizedText;
  explanation?: LocalizedText | null;
  options: AssessmentOption[];
  order: number;
}

export interface NextQuestionResponse {
  done: boolean;
  question: AssessmentQuestion | null;
  questionIndex?: number;
  totalQuestions?: number;
}

type RawNextQuestionResponse =
  | NextQuestionResponse
  | (Partial<AssessmentQuestion> & {
      id?: number;
      skill?: string;
      level?: string;
      question?: LocalizedText;
      options?: Array<Partial<AssessmentOption> & { id?: number; text?: LocalizedText; order?: number }>;
      currentIndex?: number;
      total?: number;
    });

export interface SubmitAnswerResponse {
  done: boolean;
  attemptStatus?: string;
  status?: string;
  isCorrect?: boolean;
}

type RawSubmitAnswerResponse =
  | SubmitAnswerResponse
  | {
      done?: boolean;
      isCorrect?: boolean;
      attemptStatus?: string;
      status?: string;
      attempt?: {
        status?: string;
        completedAt?: string | null;
      } | null;
      completedAt?: string | null;
    };

export interface AssessmentRecommendation {
  learningPathId?: number;
  learningPathTitleKy?: string;
  learningPathTitleRu?: string;
  learningPathTitleEn?: string;
  messageKy?: string;
  messageRu?: string;
  messageEn?: string;
  startModuleId?: number | null;
  startLessonId?: number | null;
}

export interface AssessmentAttemptResult {
  id: number;
  goal: StudentGoal;
  status: string;
  overallLevel: EnglishLevel | null;
  score: number;
  skillScores: Partial<Record<EnglishSkill, number>> | null;
  levelScores: Partial<Record<EnglishLevel, number>> | null;
  weakSkills: EnglishSkill[] | null;
  recommendation: AssessmentRecommendation | null;
  startedAt: string;
  completedAt: string | null;
  expiresAt?: string | null;
  timeLimitMinutes?: number | null;
  assignedQuestionIds?: number[];
}

export function cl(obj: { ky?: string; ru?: string; en?: string } | null | undefined, lang: string): string {
  if (!obj) return "";
  return (obj as Record<string, string>)[lang] ?? (obj as Record<string, string>).ky ?? obj.en ?? "";
}

export interface AdminAnalytics {
  totalAttempts: number;
  completedAttempts: number;
  avgScore: number;
  levelDistribution: Partial<Record<EnglishLevel, number>>;
  goalDistribution: Record<string, number>;
  avgSkillScores: Partial<Record<EnglishSkill, number>>;
}

export interface AssessmentTest {
  id: number;
  subject: string;
  type: "placement" | "quiz" | "final_exam";
  titleKy: string;
  titleRu: string;
  titleEn: string;
  descriptionKy?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  companyId: number | null;
  isActive: boolean;
  questionCount: number;
  timeLimitMinutes: number | null;
}

export interface CreateTestDto {
  subject?: string;
  type: "placement" | "quiz" | "final_exam";
  titleKy: string;
  titleRu: string;
  titleEn: string;
  descriptionKy?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  questionCount?: number;
  timeLimitMinutes?: number | null;
}

export interface UpdateTestDto {
  titleKy?: string;
  titleRu?: string;
  titleEn?: string;
  descriptionKy?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  isActive?: boolean;
  questionCount?: number;
  timeLimitMinutes?: number | null;
  version?: number;
}

export interface CreateQuestionDto {
  testId: number;
  subject?: string;
  skill: EnglishSkill;
  level: EnglishLevel;
  difficulty?: number;
  question: LocalizedText;
  explanation?: LocalizedText | null;
  order?: number;
  options?: AssessmentOptionInput[];
}

export interface UpdateQuestionDto {
  skill?: EnglishSkill;
  level?: EnglishLevel;
  difficulty?: number;
  question?: LocalizedText;
  explanation?: LocalizedText | null;
  isActive?: boolean;
  order?: number;
  options?: AssessmentOptionInput[];
}

export interface AdminQuestion {
  id: number;
  testId: number;
  level: EnglishLevel;
  skill: EnglishSkill;
  difficulty: number;
  question: LocalizedText;
  explanation?: LocalizedText | null;
  options: AssessmentOption[];
  order: number;
  isActive: boolean;
}

export interface LearningPath {
  id: number;
  titleEn: string;
  titleKy: string;
  titleRu: string;
  goal: StudentGoal;
  level: EnglishLevel;
  isActive: boolean;
}

export const assessmentKeys = {
  result: (attemptId: string | number) => ["assessment", "result", String(attemptId)] as const,
  myCurrent: () => ["assessment", "my-current"] as const,
  myLatest: () => ["assessment", "my-latest"] as const,
  adminAnalytics: () => ["assessment", "admin", "analytics"] as const,
  adminQuestions: (filters: { level?: string; skill?: string; testId?: number | string }) =>
    ["assessment", "admin", "questions", filters] as const,
  adminPaths: () => ["assessment", "admin", "paths"] as const,
  adminTests: () => ["assessment", "admin", "tests"] as const,
  adminAttempts: (params: { status?: string; limit?: number }) =>
    ["assessment", "admin", "attempts", params] as const,
  studentLatest: (userId: number) => ["assessment", "admin", "student-latest", userId] as const,
};

export function useStartAssessmentAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: StudentGoal) =>
      apiRequest<AssessmentAttemptResult>(`/assessment-tests/start`, {
        method: "POST",
        body: { goal },
      }),
    onSuccess: (attempt) => {
      qc.setQueryData(assessmentKeys.myCurrent(), attempt);
      qc.invalidateQueries({ queryKey: ["assessment"] });
    },
  });
}

function isTopLevelQuestionPayload(value: unknown): value is Extract<RawNextQuestionResponse, { currentIndex?: number; total?: number }> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    Array.isArray(record.options) &&
    Boolean(record.question)
  );
}

function normalizeQuestionOption(
  option: Partial<AssessmentOption> & { id?: number; text?: LocalizedText; order?: number },
  index: number,
): AssessmentOption {
  return {
    id: typeof option.id === "number" ? option.id : index + 1,
    text: option.text && typeof option.text === "object" ? option.text : { en: "" },
    isCorrect: option.isCorrect,
    order: typeof option.order === "number" ? option.order : index,
  };
}

function normalizeQuestionPayload(
  payload: Extract<RawNextQuestionResponse, { currentIndex?: number; total?: number }>,
): AssessmentQuestion {
  return {
    id: typeof payload.id === "number" ? payload.id : 0,
    skill:
      payload.skill === "grammar" ||
      payload.skill === "vocabulary" ||
      payload.skill === "reading" ||
      payload.skill === "communication"
        ? payload.skill
        : "grammar",
    level:
      payload.level === "A0" ||
      payload.level === "A1" ||
      payload.level === "A2" ||
      payload.level === "B1" ||
      payload.level === "B2"
        ? payload.level
        : "A1",
    difficulty: typeof payload.difficulty === "number" ? payload.difficulty : 1,
    question: payload.question && typeof payload.question === "object" ? payload.question : { en: "" },
    explanation: payload.explanation ?? null,
    options: Array.isArray(payload.options) ? payload.options.map(normalizeQuestionOption) : [],
    order: typeof payload.order === "number" ? payload.order : 0,
  };
}

function normalizeNextQuestionResponse(payload: RawNextQuestionResponse): NextQuestionResponse {
  if (isTopLevelQuestionPayload(payload)) {
    return {
      done: false,
      question: normalizeQuestionPayload(payload),
      questionIndex: typeof payload.currentIndex === "number" ? payload.currentIndex : undefined,
      totalQuestions: typeof payload.total === "number" ? payload.total : undefined,
    };
  }

  return payload;
}

function normalizeSubmitAnswerResponse(payload: RawSubmitAnswerResponse): SubmitAnswerResponse {
  const extendedPayload = payload as {
    attempt?: { status?: string; completedAt?: string | null } | null;
    completedAt?: string | null;
  };
  const attemptStatus =
    payload.attemptStatus ??
    payload.status ??
    extendedPayload.attempt?.status;
  const isCompleted =
    payload.done === true ||
    attemptStatus === "completed" ||
    extendedPayload.completedAt != null ||
    extendedPayload.attempt?.completedAt != null;

  return {
    done: isCompleted,
    attemptStatus,
    status: payload.status,
    isCorrect: payload.isCorrect,
  };
}

export async function fetchNextQuestion(attemptId: string | number): Promise<NextQuestionResponse> {
  const response = await apiRequest<RawNextQuestionResponse>(`/assessment-attempts/${attemptId}/next-question`);
  return normalizeNextQuestionResponse(response);
}

export async function postAnswer(
  attemptId: string | number,
  payload: { questionId: number; selectedOptionId: number; timeSpentSeconds?: number },
): Promise<SubmitAnswerResponse> {
  const response = await apiRequest<RawSubmitAnswerResponse>(`/assessment-attempts/${attemptId}/answer`, {
    method: "POST",
    body: payload,
  });
  return normalizeSubmitAnswerResponse(response);
}

export async function postComplete(attemptId: string | number): Promise<unknown> {
  return apiRequest(`/assessment-attempts/${attemptId}/complete`, { method: "POST" });
}

export function fetchMyCurrentAttempt() {
  return apiRequest<AssessmentAttemptResult | null>("/assessment-attempts/my-current").catch(() => null);
}

export function fetchMyLatestResult() {
  return apiRequest<AssessmentAttemptResult | null>("/assessment-attempts/my-latest").catch(() => null);
}

export function useAttemptResult(attemptId: string | number) {
  return useQuery({
    queryKey: assessmentKeys.result(attemptId),
    queryFn: () => apiRequest<AssessmentAttemptResult>(`/assessment-attempts/${attemptId}/result`),
    enabled: !!attemptId,
  });
}

export function useMyCurrentAttempt() {
  return useQuery({
    queryKey: assessmentKeys.myCurrent(),
    queryFn: fetchMyCurrentAttempt,
    staleTime: 30_000,
  });
}

export function useMyLatestResult() {
  return useQuery({
    queryKey: assessmentKeys.myLatest(),
    queryFn: fetchMyLatestResult,
    staleTime: 60_000,
  });
}

export async function abandonAttempt(attemptId: string | number): Promise<{ abandoned: true }> {
  return apiRequest<{ abandoned: true }>(`/assessment-attempts/${attemptId}/abandon`, {
    method: "POST",
  });
}

export interface AdminAttempt {
  id: number;
  studentId: number;
  testId: number;
  status: string;
  goal: StudentGoal;
  overallLevel: EnglishLevel | null;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function useAssessmentAdminAttempts(params: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: assessmentKeys.adminAttempts(params),
    queryFn: () =>
      apiRequest<[AdminAttempt[], number]>("/admin/assessment/attempts", {
        params: { ...params, limit: params.limit ?? 50 },
      }).then((res) => (Array.isArray(res) ? res : [[], 0])),
  });
}

export function useAssessmentAdminTests() {
  return useQuery({
    queryKey: assessmentKeys.adminTests(),
    queryFn: () =>
      apiRequest<AssessmentTest[]>("/admin/assessment/tests").then((res) =>
        Array.isArray(res) ? res : [],
      ),
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestDto) =>
      apiRequest<AssessmentTest>("/admin/assessment/tests", { method: "POST", body: dto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assessmentKeys.adminTests() });
    },
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateTestDto }) =>
      apiRequest<AssessmentTest>(`/admin/assessment/tests/${id}`, { method: "PATCH", body: dto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assessmentKeys.adminTests() });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ deleted: true }>(`/admin/assessment/tests/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assessmentKeys.adminTests() });
      qc.invalidateQueries({ queryKey: ["assessment", "admin", "questions"] });
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuestionDto) =>
      apiRequest<AdminQuestion>("/admin/assessment/questions", { method: "POST", body: dto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment", "admin", "questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateQuestionDto }) =>
      apiRequest<AdminQuestion>(`/admin/assessment/questions/${id}`, { method: "PATCH", body: dto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment", "admin", "questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ deleted: true }>(`/admin/assessment/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment", "admin", "questions"] });
    },
  });
}

export function useStudentLatestResult(userId: number, enabled = true) {
  return useQuery({
    queryKey: assessmentKeys.studentLatest(userId),
    queryFn: () =>
      apiRequest<AssessmentAttemptResult | null>(
        `/admin/assessment/students/${userId}/latest-result`,
      ).catch(() => null),
    enabled: enabled && !!userId,
    staleTime: 60_000,
  });
}

export function useAssessmentAdminAnalytics() {
  return useQuery({
    queryKey: assessmentKeys.adminAnalytics(),
    queryFn: () => apiRequest<AdminAnalytics>("/admin/assessment/analytics"),
  });
}

export function useAssessmentAdminQuestions(
  filters: { level?: string; skill?: string; testId?: number | string } = {},
) {
  return useQuery({
    queryKey: assessmentKeys.adminQuestions(filters),
    queryFn: () =>
      apiRequest<AdminQuestion[] | { data: AdminQuestion[]; total: number }>(
        "/admin/assessment/questions",
        { params: { ...filters, limit: 100 } },
      ).then((res) => (Array.isArray(res) ? res : (res.data ?? []))),
  });
}

export function useAssessmentAdminPaths() {
  return useQuery({
    queryKey: assessmentKeys.adminPaths(),
    queryFn: () =>
      apiRequest<LearningPath[] | { data: LearningPath[] }>("/admin/assessment/learning-paths").then(
        (res) => (Array.isArray(res) ? res : (res.data ?? [])),
      ),
  });
}
