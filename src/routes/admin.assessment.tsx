import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleDot,
  FlaskConical,
  Map,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useAssessmentAdminAnalytics,
  useAssessmentAdminAttempts,
  useAssessmentAdminPaths,
  useAssessmentAdminQuestions,
  useAssessmentAdminTests,
  useCreateQuestion,
  useCreateTest,
  useDeleteQuestion,
  useDeleteTest,
  useUpdateQuestion,
  useUpdateTest,
  type AdminAttempt,
  type AdminQuestion,
  type AssessmentOptionInput,
  type AssessmentTest,
  type CreateQuestionDto,
  type CreateTestDto,
  type EnglishLevel,
  type EnglishSkill,
  type LearningPath,
  type LocalizedText,
  type UpdateQuestionDto,
  type UpdateTestDto,
} from "@/lib/assessment-api";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/admin/assessment")({
  validateSearch: z.object({
    tab: z.enum(["analytics", "questions", "paths", "tests", "results"]).optional(),
  }),
  head: () => ({ meta: [{ title: `${i18n.t("app.name")} — ${i18n.t("assessment.admin.title")}` }] }),
  component: AdminAssessmentPage,
});

const LEVELS: EnglishLevel[] = ["A0", "A1", "A2", "B1", "B2"];
const SKILLS: EnglishSkill[] = ["grammar", "vocabulary", "reading", "communication"];

const LEVEL_COLORS: Record<EnglishLevel, { bg: string; text: string; border: string }> = {
  A0: { bg: "bg-muted", text: "text-foreground/60", border: "border-border" },
  A1: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  A2: { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  B1: { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  B2: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
};

const EMPTY_TEST_FORM: TestFormState = {
  type: "placement",
  titleEn: "",
  titleRu: "",
  titleKy: "",
  questionCount: 30,
  timeLimitMinutes: null,
  isActive: true,
};

type Tab = "analytics" | "questions" | "paths" | "tests" | "results";
type QuestionInputMode = "manual" | "paste";
type TestFormState = CreateTestDto & { isActive: boolean };
type EditableOption = { text: { en: string; ru: string; ky: string }; isCorrect: boolean; order: number };
type QuestionFormState = {
  testId: string;
  skill: EnglishSkill;
  level: EnglishLevel;
  difficulty: number;
  order: number;
  isActive: boolean;
  question: { en: string; ru: string; ky: string };
  explanation: { en: string; ru: string; ky: string };
  options: EditableOption[];
};

const TABS: { key: Tab; icon: typeof BarChart3 }[] = [
  { key: "analytics", icon: BarChart3 },
  { key: "tests", icon: FlaskConical },
  { key: "questions", icon: BookOpen },
  { key: "paths", icon: Map },
  { key: "results", icon: Users },
];

function LevelBadge({ level }: { level: EnglishLevel }) {
  const c = LEVEL_COLORS[level];
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg border text-xs font-black ${c.bg} ${c.text} ${c.border}`}>
      {level}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

function getLanguageKey(language: string) {
  return language.split("-")[0] as "en" | "ru" | "ky";
}

function getLocalizedText(value: { en?: string | null; ru?: string | null; ky?: string | null }, language: string) {
  const key = getLanguageKey(language);
  return value[key] || value.en || value.ru || value.ky || "";
}

function getTestTitle(test: Pick<AssessmentTest, "titleEn" | "titleRu" | "titleKy">, language: string) {
  return getLocalizedText({ en: test.titleEn, ru: test.titleRu, ky: test.titleKy }, language);
}

function getTestTypeLabel(
  type: AssessmentTest["type"] | CreateTestDto["type"],
  t: ReturnType<typeof useTranslation>["t"],
) {
  return t(`assessment.admin.tests.types.${type}`);
}

function createEmptyQuestionForm(defaultTestId?: number): QuestionFormState {
  return {
    testId: defaultTestId ? String(defaultTestId) : "",
    skill: "grammar",
    level: "A1",
    difficulty: 1,
    order: 0,
    isActive: true,
    question: { en: "", ru: "", ky: "" },
    explanation: { en: "", ru: "", ky: "" },
    options: Array.from({ length: 4 }, (_, index) => ({
      text: { en: "", ru: "", ky: "" },
      isCorrect: index === 0,
      order: index,
    })),
  };
}

function coerceLocalizedDraft(value: unknown): { en: string; ru: string; ky: string } {
  if (typeof value === "string") {
    return { en: value, ru: "", ky: "" };
  }
  if (!value || typeof value !== "object") {
    return { en: "", ru: "", ky: "" };
  }
  const record = value as Record<string, unknown>;
  return {
    en: typeof record.en === "string" ? record.en : "",
    ru: typeof record.ru === "string" ? record.ru : "",
    ky: typeof record.ky === "string" ? record.ky : "",
  };
}

function parseQuestionDraft(raw: string, defaultTestId?: number): QuestionFormState {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const base = createEmptyQuestionForm(defaultTestId);
  const rawOptions = Array.isArray(parsed.options) ? parsed.options : base.options;
  const options = rawOptions.map((option, index) => {
    if (typeof option === "string") {
      return {
        text: { en: option, ru: "", ky: "" },
        isCorrect: index === 0,
        order: index,
      };
    }
    const record = option && typeof option === "object" ? option as Record<string, unknown> : {};
    return {
      text: coerceLocalizedDraft(record.text),
      isCorrect: Boolean(record.isCorrect),
      order: typeof record.order === "number" ? record.order : index,
    };
  });

  return {
    testId: typeof parsed.testId === "number" || typeof parsed.testId === "string"
      ? String(parsed.testId)
      : base.testId,
    skill: SKILLS.includes(parsed.skill as EnglishSkill) ? parsed.skill as EnglishSkill : base.skill,
    level: LEVELS.includes(parsed.level as EnglishLevel) ? parsed.level as EnglishLevel : base.level,
    difficulty: typeof parsed.difficulty === "number" ? parsed.difficulty : base.difficulty,
    order: typeof parsed.order === "number" ? parsed.order : base.order,
    isActive: typeof parsed.isActive === "boolean" ? parsed.isActive : base.isActive,
    question: coerceLocalizedDraft(parsed.question),
    explanation: coerceLocalizedDraft(parsed.explanation),
    options: options.length >= 2 ? options : base.options,
  };
}

function normalizeLocalizedText(value: { en: string; ru: string; ky: string }, optional = false): LocalizedText | null {
  const en = value.en.trim();
  const ru = value.ru.trim();
  const ky = value.ky.trim();
  if (optional && !en && !ru && !ky) return null;
  return {
    en,
    ...(ru ? { ru } : {}),
    ...(ky ? { ky } : {}),
  };
}

function mapQuestionToForm(question: AdminQuestion): QuestionFormState {
  return {
    testId: String(question.testId),
    skill: question.skill,
    level: question.level,
    difficulty: question.difficulty,
    order: question.order,
    isActive: question.isActive,
    question: {
      en: question.question?.en ?? "",
      ru: question.question?.ru ?? "",
      ky: question.question?.ky ?? "",
    },
    explanation: {
      en: question.explanation?.en ?? "",
      ru: question.explanation?.ru ?? "",
      ky: question.explanation?.ky ?? "",
    },
    options: (question.options ?? []).map((option, index) => ({
      text: {
        en: option.text?.en ?? "",
        ru: option.text?.ru ?? "",
        ky: option.text?.ky ?? "",
      },
      isCorrect: Boolean(option.isCorrect),
      order: option.order ?? index,
    })),
  };
}

function buildQuestionPayload(form: QuestionFormState): CreateQuestionDto | UpdateQuestionDto | null {
  const normalizedQuestion = normalizeLocalizedText(form.question);
  if (!normalizedQuestion?.en) return null;

  const options = form.options
    .map((option, index) => ({
      text: normalizeLocalizedText(option.text),
      isCorrect: option.isCorrect,
      order: index,
    }))
    .filter((option): option is { text: LocalizedText; isCorrect: boolean; order: number } => Boolean(option.text?.en));

  if (options.length < 2 || !options.some((option) => option.isCorrect)) return null;

  return {
    skill: form.skill,
    level: form.level,
    difficulty: form.difficulty,
    order: form.order,
    isActive: form.isActive,
    question: normalizedQuestion,
    explanation: normalizeLocalizedText(form.explanation, true),
    options: options as AssessmentOptionInput[],
  };
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "neutral",
  disabled = false,
}: {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  variant?: "neutral" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-black transition-colors disabled:opacity-50",
        variant === "danger"
          ? "border border-destructive/20 text-destructive hover:bg-destructive/10"
          : "border border-border text-foreground/70 hover:bg-muted",
      ].join(" ")}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function AnalyticsTab() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useAssessmentAdminAnalytics();

  if (isError) {
    return <p className="text-sm text-destructive py-8 text-center">{t("assessment.admin.loadError")}</p>;
  }

  const metrics = [
    { label: t("assessment.admin.totalAttempts"), value: isLoading ? "—" : String(data?.totalAttempts ?? 0) },
    { label: t("assessment.admin.completed"), value: isLoading ? "—" : String(data?.completedAttempts ?? 0) },
    {
      label: t("assessment.admin.avgScore"),
      value: isLoading ? "—" : data?.avgScore != null ? `${Math.round(data.avgScore)}%` : "—",
    },
  ];

  const dist = data?.levelDistribution ?? {};
  const maxCount = Math.max(...LEVELS.map((level) => dist[level] ?? 0), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value }) =>
          isLoading ? (
            <Skeleton key={label} className="h-24 rounded-2xl" />
          ) : (
            <div key={label} className="rounded-2xl border-2 border-border bg-card p-5 chunky-shadow">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/45 mb-2">{label}</p>
              <p className="text-3xl font-black">{value}</p>
            </div>
          ),
        )}
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-6 chunky-shadow">
        <h3 className="font-black text-sm mb-5">{t("assessment.admin.levelDistribution")}</h3>
        <div className="space-y-4">
          {LEVELS.map((level) => {
            const count = dist[level] ?? 0;
            const pct = Math.round((count / maxCount) * 100);
            const c = LEVEL_COLORS[level];
            return (
              <div key={level} className="flex items-center gap-4">
                <LevelBadge level={level} />
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  {isLoading ? (
                    <div className="h-full bg-muted-foreground/20 animate-pulse rounded-full" style={{ width: "60%" }} />
                  ) : (
                    <div className={`h-full ${c.bg.replace("dark:", "")} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  )}
                </div>
                <span className="text-sm font-black font-mono w-8 text-right text-foreground/60">{isLoading ? "…" : count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuestionsTab({ canWrite }: { canWrite: boolean }) {
  const { t, i18n: activeI18n } = useTranslation();
  const language = activeI18n.resolvedLanguage ?? activeI18n.language ?? "en";
  const { data: tests = [] } = useAssessmentAdminTests();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("");
  const [skill, setSkill] = useState<string>("");
  const [testId, setTestId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState<QuestionInputMode>("manual");
  const [pastedQuestionText, setPastedQuestionText] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionFormState>(createEmptyQuestionForm());

  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const editableTests = tests.filter((test) => test.companyId !== null);
  const editableTestIds = new Set(editableTests.map((test) => test.id));
  const { data: questions = [], isLoading, isError } = useAssessmentAdminQuestions({
    level,
    skill,
    testId,
  });

  const filtered = questions.filter((question) => {
    if (!search) return true;
    const haystack = [
      question.question?.en,
      question.question?.ru,
      question.question?.ky,
      getTestTitle(tests.find((test) => test.id === question.testId) ?? { titleEn: "", titleRu: "", titleKy: "" }, language),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const inputCls = "w-full h-9 px-3 rounded-xl border-2 border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const selectCls = "w-full h-9 pl-3 pr-8 rounded-xl border-2 border-border bg-card text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary";

  const resetForm = () => {
    setEditingQuestionId(null);
    setShowForm(false);
    setInputMode("manual");
    setPastedQuestionText("");
    setForm(createEmptyQuestionForm(editableTests[0]?.id));
  };

  const applyPastedQuestion = () => {
    try {
      const nextForm = parseQuestionDraft(pastedQuestionText, editableTests[0]?.id);
      setForm(nextForm);
      setInputMode("manual");
      toast.success(t("assessment.admin.questions.pasteApplied"));
    } catch {
      toast.error(t("assessment.admin.questions.pasteInvalid"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTestId = Number(form.testId);
    if (!numericTestId) {
      toast.error(t("assessment.admin.questions.selectTestPrompt"));
      return;
    }

    const payload = buildQuestionPayload(form);
    if (!payload) {
      toast.error(t("assessment.admin.questions.invalidQuestion"));
      return;
    }

    if (editingQuestionId) {
      updateQuestion.mutate(
        { id: editingQuestionId, dto: payload as UpdateQuestionDto },
        {
          onSuccess: () => {
            toast.success(t("assessment.admin.questions.updated"));
            resetForm();
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError"));
          },
        },
      );
      return;
    }

    createQuestion.mutate(
      { ...(payload as CreateQuestionDto), testId: numericTestId },
      {
        onSuccess: () => {
          toast.success(t("assessment.admin.questions.created"));
          resetForm();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError"));
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("assessment.admin.searchPlaceholder")}
            className="w-full h-9 pl-9 pr-3 rounded-xl border-2 border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="relative min-w-36">
          <select value={testId} onChange={(e) => setTestId(e.target.value)} className={selectCls}>
            <option value="">{t("assessment.admin.questions.allTests")}</option>
            {tests.map((test) => (
              <option key={test.id} value={String(test.id)}>
                {getTestTitle(test, language)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
            <option value="">{t("assessment.admin.allLevels")}</option>
            {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={skill} onChange={(e) => setSkill(e.target.value)} className={selectCls}>
            <option value="">{t("assessment.admin.allSkills")}</option>
            {SKILLS.map((item) => (
              <option key={item} value={item}>{t(`assessment.result.skills.${item}`)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
        </div>
      </div>

      {canWrite && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setForm(createEmptyQuestionForm(editableTests[0]?.id));
              setEditingQuestionId(null);
              setInputMode("manual");
              setPastedQuestionText("");
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            {t("assessment.admin.questions.createBtn")}
          </button>
        </div>
      )}

      <Dialog open={showForm && canWrite} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-border p-0 gap-0">
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <DialogHeader className="pr-8">
              <DialogTitle className="font-black text-xl">
                {editingQuestionId
                  ? t("assessment.admin.questions.editTitle")
                  : t("assessment.admin.questions.formTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("assessment.admin.questions.invalidQuestion")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border-2 border-border bg-muted/40 p-1">
                {([
                  [ "manual", t("assessment.admin.questions.inputModes.manual") ],
                  [ "paste", t("assessment.admin.questions.inputModes.paste") ],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInputMode(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${inputMode === value ? "bg-card text-foreground shadow-sm" : "text-foreground/55 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
                />
                {t("assessment.admin.colActive")}
              </label>
            </div>

            {inputMode === "paste" ? (
              <div className="space-y-3">
                <pre className="rounded-2xl border-2 border-border bg-muted/40 p-3 text-xs text-foreground/60 overflow-x-auto whitespace-pre-wrap">
{`{
  "testId": 12,
  "skill": "grammar",
  "level": "A1",
  "difficulty": 2,
  "order": 1,
  "question": { "en": "Choose the correct sentence" },
  "explanation": { "en": "Use the present simple here." },
  "options": [
    { "text": { "en": "She go to school." }, "isCorrect": false },
    { "text": { "en": "She goes to school." }, "isCorrect": true }
  ]
}`}
                </pre>
                <Textarea
                  acceptTabs
                  rows={14}
                  value={pastedQuestionText}
                  onChange={(e) => setPastedQuestionText(e.target.value)}
                  placeholder={t("assessment.admin.questions.pastePlaceholder")}
                  className="min-h-[280px] rounded-2xl border-2 border-border bg-card font-mono text-sm"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={applyPastedQuestion}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-opacity"
                  >
                    {t("assessment.admin.questions.applyPaste")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.questions.fieldTest")}
                    </label>
                    <div className="relative">
                      <select className={selectCls} value={form.testId} onChange={(e) => setForm((current) => ({ ...current, testId: e.target.value }))}>
                        <option value="">{t("assessment.admin.questions.selectTest")}</option>
                        {editableTests.map((test) => (
                          <option key={test.id} value={String(test.id)}>
                            {getTestTitle(test, language)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.colSkill")}
                    </label>
                    <div className="relative">
                      <select className={selectCls} value={form.skill} onChange={(e) => setForm((current) => ({ ...current, skill: e.target.value as EnglishSkill }))}>
                        {SKILLS.map((item) => (
                          <option key={item} value={item}>{t(`assessment.result.skills.${item}`)}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.colLevel")}
                    </label>
                    <div className="relative">
                      <select className={selectCls} value={form.level} onChange={(e) => setForm((current) => ({ ...current, level: e.target.value as EnglishLevel }))}>
                        {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.colDifficulty")}
                    </label>
                    <input type="number" min={1} max={5} className={inputCls} value={form.difficulty} onChange={(e) => setForm((current) => ({ ...current, difficulty: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.questions.fieldOrder")}
                    </label>
                    <input type="number" min={0} className={inputCls} value={form.order} onChange={(e) => setForm((current) => ({ ...current, order: Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["en", "ru", "ky"] as const).map((locale) => (
                    <div key={locale} className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                        {t("assessment.admin.questions.fieldQuestion")} ({locale.toUpperCase()})
                      </label>
                      <Textarea
                        acceptTabs
                        rows={3}
                        className={`${inputCls} h-auto min-h-[96px] resize-y`}
                        value={form.question[locale]}
                        onChange={(e) => setForm((current) => ({ ...current, question: { ...current.question, [locale]: e.target.value } }))}
                        required={locale === "en"}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["en", "ru", "ky"] as const).map((locale) => (
                    <div key={locale} className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                        {t("assessment.admin.questions.fieldExplanation")} ({locale.toUpperCase()})
                      </label>
                      <Textarea
                        acceptTabs
                        rows={3}
                        className={`${inputCls} h-auto min-h-[96px] resize-y`}
                        value={form.explanation[locale]}
                        onChange={(e) => setForm((current) => ({ ...current, explanation: { ...current.explanation, [locale]: e.target.value } }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                      {t("assessment.admin.questions.fieldOptions")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        options: [
                          ...current.options,
                          { text: { en: "", ru: "", ky: "" }, isCorrect: false, order: current.options.length },
                        ],
                      }))}
                      className="text-xs font-black text-primary"
                    >
                      {t("assessment.admin.questions.addOption")}
                    </button>
                  </div>

                  {form.options.map((option, index) => (
                    <div key={`${editingQuestionId ?? "new"}-${index}`} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground/70">
                          <input
                            type="radio"
                            name="correct-option"
                            checked={option.isCorrect}
                            onChange={() => setForm((current) => ({
                              ...current,
                              options: current.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })),
                            }))}
                          />
                          {t("assessment.admin.questions.correctOption")}
                        </label>
                        {form.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setForm((current) => ({
                              ...current,
                              options: current.options
                                .filter((_, itemIndex) => itemIndex !== index)
                                .map((item, itemIndex) => ({ ...item, order: itemIndex, isCorrect: item.isCorrect && itemIndex === 0 ? true : item.isCorrect })),
                            }))}
                            className="text-xs font-black text-destructive"
                          >
                            {t("assessment.admin.questions.removeOption")}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(["en", "ru", "ky"] as const).map((locale) => (
                          <Textarea
                            key={locale}
                            acceptTabs
                            rows={2}
                            className={`${inputCls} h-auto min-h-[76px] resize-y`}
                            placeholder={`${t("assessment.admin.questions.optionPlaceholder")} ${index + 1} (${locale.toUpperCase()})`}
                            value={option.text[locale]}
                            onChange={(e) => setForm((current) => ({
                              ...current,
                              options: current.options.map((item, itemIndex) => itemIndex === index
                                ? { ...item, text: { ...item.text, [locale]: e.target.value } }
                                : item),
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border-2 border-border text-sm font-bold hover:bg-muted transition-colors">
                {t("assessment.admin.tests.cancelBtn")}
              </button>
              <button
                type="submit"
                disabled={inputMode === "paste" || createQuestion.isPending || updateQuestion.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createQuestion.isPending || updateQuestion.isPending
                  ? "…"
                  : editingQuestionId
                    ? t("assessment.admin.questions.saveBtn")
                    : t("assessment.admin.questions.submitBtn")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isError ? (
        <p className="text-sm text-destructive py-8 text-center">{t("assessment.admin.loadError")}</p>
      ) : isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-foreground/45 py-12 text-center">{t("assessment.admin.noQuestions")}</p>
      ) : (
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.questions.colTest")}</th>
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colLevel")}</th>
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colSkill")}</th>
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colQuestion")}</th>
                <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colDifficulty")}</th>
                <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colActive")}</th>
                {canWrite && (
                  <th className="text-right px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">
                    {t("assessment.admin.questions.colActions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((question) => {
                const test = tests.find((item) => item.id === question.testId);
                const canManage = editableTestIds.has(question.testId);
                return (
                  <tr key={question.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black truncate max-w-44">{test ? getTestTitle(test, language) : `#${question.testId}`}</p>
                      <p className="text-xs text-foreground/45 mt-0.5">#{question.testId}</p>
                    </td>
                    <td className="px-4 py-3"><LevelBadge level={question.level} /></td>
                    <td className="px-4 py-3">{t(`assessment.result.skills.${question.skill}`)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-2">{getLocalizedText(question.question, language)}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-sm">{question.difficulty}</td>
                    <td className="px-4 py-3 text-center">
                      <CircleDot className={`size-4 mx-auto ${question.isActive ? "text-green-500" : "text-foreground/25"}`} />
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-2">
                            <ActionButton
                              label={t("assessment.admin.tests.editBtn")}
                              icon={Pencil}
                              onClick={() => {
                                setEditingQuestionId(question.id);
                                setForm(mapQuestionToForm(question));
                                setInputMode("manual");
                                setPastedQuestionText("");
                                setShowForm(true);
                              }}
                            />
                            <ActionButton
                              label={t("assessment.admin.tests.deleteBtn")}
                              icon={Trash2}
                              variant="danger"
                              disabled={deleteQuestion.isPending}
                              onClick={() => {
                                if (!window.confirm(t("assessment.admin.questions.confirmDelete"))) return;
                                deleteQuestion.mutate(question.id, {
                                  onSuccess: () => toast.success(t("assessment.admin.questions.deleted")),
                                  onError: (error) => toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError")),
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-foreground/35">
                            {t("assessment.admin.questions.sharedReadOnly")}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PathsTab() {
  const { t, i18n: activeI18n } = useTranslation();
  const language = activeI18n.resolvedLanguage ?? activeI18n.language ?? "en";
  const { data: paths = [], isLoading, isError } = useAssessmentAdminPaths();

  return isError ? (
    <p className="text-sm text-destructive py-8 text-center">{t("assessment.admin.loadError")}</p>
  ) : isLoading ? (
    <div className="space-y-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 rounded-xl" />)}</div>
  ) : paths.length === 0 ? (
    <p className="text-sm text-foreground/45 py-12 text-center">{t("assessment.admin.noPaths")}</p>
  ) : (
    <div className="rounded-2xl border-2 border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colTitle")}</th>
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colGoal")}</th>
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colLevel")}</th>
            <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colActive")}</th>
          </tr>
        </thead>
        <tbody>
          {paths.map((path: LearningPath) => (
            <tr key={path.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <p className="font-black truncate max-w-xs">{getLocalizedText({ en: path.titleEn, ru: path.titleRu, ky: path.titleKy }, language)}</p>
                {path.titleKy && path.titleKy !== getLocalizedText({ en: path.titleEn, ru: path.titleRu, ky: path.titleKy }, language) && (
                  <p className="text-xs text-foreground/45 truncate mt-0.5">{path.titleKy}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-lg bg-muted text-xs font-bold">{t(`assessment.goals.${path.goal}.label`)}</span>
              </td>
              <td className="px-4 py-3"><LevelBadge level={path.level} /></td>
              <td className="px-4 py-3 text-center">
                <CircleDot className={`size-4 mx-auto ${path.isActive ? "text-green-500" : "text-foreground/25"}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestsTab({ canWrite }: { canWrite: boolean }) {
  const { t, i18n: activeI18n } = useTranslation();
  const language = activeI18n.resolvedLanguage ?? activeI18n.language ?? "en";
  const { data: tests = [], isLoading, isError } = useAssessmentAdminTests();
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  const [showForm, setShowForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [form, setForm] = useState<TestFormState>(EMPTY_TEST_FORM);

  const inputCls = "w-full h-9 px-3 rounded-xl border-2 border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const selectCls = "w-full h-9 pl-3 pr-8 rounded-xl border-2 border-border bg-card text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary";

  const resetForm = () => {
    setEditingTestId(null);
    setShowForm(false);
    setForm(EMPTY_TEST_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.titleRu || !form.titleKy) return;

    if (editingTestId) {
      const dto: UpdateTestDto = {
        titleEn: form.titleEn,
        titleRu: form.titleRu,
        titleKy: form.titleKy,
        questionCount: form.questionCount,
        timeLimitMinutes: form.timeLimitMinutes ?? null,
        isActive: form.isActive,
      };
      updateTest.mutate(
        { id: editingTestId, dto },
        {
          onSuccess: () => {
            toast.success(t("assessment.admin.tests.updated"));
            resetForm();
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError"));
          },
        },
      );
      return;
    }

    const dto: CreateTestDto = {
      type: form.type,
      titleEn: form.titleEn,
      titleRu: form.titleRu,
      titleKy: form.titleKy,
      questionCount: form.questionCount,
      timeLimitMinutes: form.timeLimitMinutes ?? null,
    };
    createTest.mutate(dto, {
      onSuccess: () => {
        toast.success(t("assessment.admin.tests.created"));
        resetForm();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError"));
      },
    });
  };

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setEditingTestId(null);
              setForm(EMPTY_TEST_FORM);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            {t("assessment.admin.tests.createBtn")}
          </button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl rounded-3xl border-2 border-border p-0 gap-0">
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <DialogHeader className="pr-8">
              <DialogTitle className="font-black text-xl">
                {editingTestId
                  ? t("assessment.admin.tests.editTitle")
                  : t("assessment.admin.tests.formTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingTestId
                  ? t("assessment.admin.tests.saveBtn")
                  : t("assessment.admin.tests.submitBtn")}
              </DialogDescription>
            </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            {editingTestId && (
              <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
                />
                {t("assessment.admin.colActive")}
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">{t("assessment.admin.tests.fieldTitleEn")}</label>
              <input className={inputCls} value={form.titleEn} onChange={(e) => setForm((current) => ({ ...current, titleEn: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">{t("assessment.admin.tests.fieldTitleRu")}</label>
              <input className={inputCls} value={form.titleRu} onChange={(e) => setForm((current) => ({ ...current, titleRu: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">{t("assessment.admin.tests.fieldTitleKy")}</label>
              <input className={inputCls} value={form.titleKy} onChange={(e) => setForm((current) => ({ ...current, titleKy: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">{t("assessment.admin.tests.fieldType")}</label>
              <div className="relative">
                <select className={selectCls} value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as CreateTestDto["type"] }))} disabled={Boolean(editingTestId)}>
                  <option value="placement">{t("assessment.admin.tests.types.placement")}</option>
                  <option value="quiz">{t("assessment.admin.tests.types.quiz")}</option>
                  <option value="final_exam">{t("assessment.admin.tests.types.final_exam")}</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">{t("assessment.admin.tests.fieldQuestions")}</label>
              <input type="number" min={1} max={200} className={inputCls} value={form.questionCount ?? 30} onChange={(e) => setForm((current) => ({ ...current, questionCount: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/50">
                {t("assessment.admin.tests.fieldTimeLimit")}
              </label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.timeLimitMinutes ?? ""}
                onChange={(e) => setForm((current) => ({
                  ...current,
                  timeLimitMinutes: e.target.value ? Number(e.target.value) : null,
                }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border-2 border-border text-sm font-bold hover:bg-muted transition-colors">
              {t("assessment.admin.tests.cancelBtn")}
            </button>
            <button type="submit" disabled={createTest.isPending || updateTest.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-opacity disabled:opacity-50">
                {createTest.isPending || updateTest.isPending
                  ? "…"
                  : editingTestId
                  ? t("assessment.admin.tests.saveBtn")
                  : t("assessment.admin.tests.submitBtn")}
            </button>
          </div>
          </form>
        </DialogContent>
      </Dialog>

      {isError ? (
        <p className="text-sm text-destructive py-8 text-center">{t("assessment.admin.loadError")}</p>
      ) : isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 rounded-xl" />)}</div>
      ) : tests.length === 0 ? (
        <p className="text-sm text-foreground/45 py-12 text-center">{t("assessment.admin.tests.noTests")}</p>
      ) : (
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.tests.colTitle")}</th>
                <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50 hidden sm:table-cell">{t("assessment.admin.tests.colType")}</th>
                <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.tests.colQuestions")}</th>
                <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.tests.colOwner")}</th>
                <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.colActive")}</th>
                {canWrite && (
                  <th className="text-right px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">
                    {t("assessment.admin.questions.colActions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tests.map((test: AssessmentTest) => {
                const canManage = canWrite && test.companyId !== null;
                return (
                  <tr key={test.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black truncate max-w-xs">{getTestTitle(test, language)}</p>
                      {test.titleKy && test.titleKy !== getTestTitle(test, language) && (
                        <p className="text-xs text-foreground/45 truncate mt-0.5">{test.titleKy}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-lg bg-muted text-xs font-bold">{getTestTypeLabel(test.type, t)}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-sm">{test.questionCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${test.companyId === null ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-primary/10 text-primary"}`}>
                        {test.companyId === null ? t("assessment.admin.tests.shared") : t("assessment.admin.tests.own")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CircleDot className={`size-4 mx-auto ${test.isActive ? "text-green-500" : "text-foreground/25"}`} />
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-2">
                            <ActionButton
                              label={t("assessment.admin.tests.editBtn")}
                              icon={Pencil}
                              onClick={() => {
                                setEditingTestId(test.id);
                                setForm({
                                  type: test.type,
                                  titleEn: test.titleEn,
                                  titleRu: test.titleRu,
                                  titleKy: test.titleKy,
                                  questionCount: test.questionCount,
                                  timeLimitMinutes: test.timeLimitMinutes,
                                  isActive: test.isActive,
                                });
                                setShowForm(true);
                              }}
                            />
                            <ActionButton
                              label={t("assessment.admin.tests.deleteBtn")}
                              icon={Trash2}
                              variant="danger"
                              disabled={deleteTest.isPending}
                              onClick={() => {
                                if (!window.confirm(t("assessment.admin.tests.confirmDelete"))) return;
                                deleteTest.mutate(test.id, {
                                  onSuccess: () => toast.success(t("assessment.admin.tests.deleted")),
                                  onError: (error) => toast.error(error instanceof Error ? error.message : t("assessment.admin.loadError")),
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-foreground/35">
                            {t("assessment.admin.questions.sharedReadOnly")}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResultsTab() {
  const { t, i18n: activeI18n } = useTranslation();
  const { data: raw, isLoading, isError } = useAssessmentAdminAttempts({ status: "completed", limit: 100 });
  const attempts = (Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : []) as AdminAttempt[];

  return isError ? (
    <p className="text-sm text-destructive py-8 text-center">{t("assessment.admin.loadError")}</p>
  ) : isLoading ? (
    <div className="space-y-2">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-12 rounded-xl" />)}</div>
  ) : attempts.length === 0 ? (
    <p className="text-sm text-foreground/45 py-12 text-center">{t("assessment.admin.results.noResults")}</p>
  ) : (
    <div className="rounded-2xl border-2 border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.results.colStudent")}</th>
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.results.colLevel")}</th>
            <th className="text-center px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50">{t("assessment.admin.results.colScore")}</th>
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50 hidden sm:table-cell">{t("assessment.admin.results.colGoal")}</th>
            <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-widest text-foreground/50 hidden md:table-cell">{t("assessment.admin.results.colDate")}</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-foreground/60">#{attempt.studentId}</td>
              <td className="px-4 py-3">
                {attempt.overallLevel ? <LevelBadge level={attempt.overallLevel} /> : <span className="text-foreground/30">—</span>}
              </td>
              <td className="px-4 py-3 text-center font-black font-mono text-sm">{attempt.score != null ? `${Math.round(attempt.score)}%` : "—"}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className="px-2 py-0.5 rounded-lg bg-muted text-xs font-bold">{t(`assessment.goals.${attempt.goal}.label`)}</span>
              </td>
              <td className="px-4 py-3 text-xs text-foreground/50 hidden md:table-cell">
                {attempt.completedAt
                  ? new Date(attempt.completedAt).toLocaleDateString(activeI18n.language, { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminAssessmentPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const navigate = useNavigate({ from: "/admin/assessment" });
  const { tab } = Route.useSearch();
  const canWrite = ["owner", "company_admin"].includes(context.activeRole);
  const activeTab: Tab = tab ?? "analytics";

  return (
    <DashboardShell>
      <TopBar title={t("assessment.admin.title")} subtitle={t("assessment.admin.subtitle")} />

      <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-muted mb-6 w-fit">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              void navigate({
                search: (prev) => ({ ...prev, tab: key }),
                replace: true,
              });
            }}
            className={[
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all duration-150 cursor-pointer",
              activeTab === key ? "bg-card text-foreground chunky-shadow" : "text-foreground/50 hover:text-foreground/80",
            ].join(" ")}
          >
            <Icon className="size-4" />
            {t(`assessment.admin.tabs.${key}`)}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && <AnalyticsTab />}
      {activeTab === "tests" && <TestsTab canWrite={canWrite} />}
      {activeTab === "questions" && <QuestionsTab canWrite={canWrite} />}
      {activeTab === "paths" && <PathsTab />}
      {activeTab === "results" && <ResultsTab />}
    </DashboardShell>
  );
}
