import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Library, Search, PlayCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import { useGeneratedQuizzes } from "@/lib/quizStore";
import {
  useQuizTemplates,
  useDeleteQuizTemplate,
  useDuplicateQuizTemplate,
  useRecordQuizTemplateUse,
  type QuizTemplateRecord,
} from "@/lib/quiz-bank-api";

export const Route = createFileRoute("/quiz-bank")({
  head: () => ({
    meta: [
      {
        title: i18n.t("quizBankPage.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Quiz Bank",
        }),
      },
    ],
  }),
  component: QuizBankPage,
});

const PROTO_QUIZZES = [
  { id: "q1", title: "Working memory — chapter quiz", course: "Cognitive Psychology", questions: 18, lastUsed: "2d ago", uses: 12 },
  { id: "q2", title: "Attention models pop quiz", course: "Cognitive Psychology", questions: 8, lastUsed: "1w ago", uses: 5 },
  { id: "q3", title: "Nucleophilic substitution", course: "Organic Chemistry II", questions: 22, lastUsed: "3d ago", uses: 9 },
  { id: "q4", title: "Stereochemistry basics", course: "Organic Chemistry II", questions: 15, lastUsed: "2w ago", uses: 7 },
  { id: "q5", title: "Lab safety refresher", course: "Organic Chemistry II", questions: 10, lastUsed: "Yesterday", uses: 3 },
  { id: "q6", title: "Modern era — vocabulary", course: "World History", questions: 30, lastUsed: "Never", uses: 0 },
];

function PrototypeQuizBankPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { list: generated, remove } = useGeneratedQuizzes();
  const [q, setQ] = useState("");
  const [list, setList] = useState(PROTO_QUIZZES);

  const all = [
    ...generated.map((quiz) => ({ ...quiz, _gen: true as const })),
    ...list.map((quiz) => ({ ...quiz, _gen: false as const })),
  ];
  const filtered = all.filter((quiz) => quiz.title.toLowerCase().includes(q.toLowerCase()));

  const duplicate = (id: string) => {
    const src = list.find((quiz) => quiz.id === id);
    if (!src) return;
    setList((prev) => [{ ...src, id: `${id}-copy-${Date.now()}`, title: t("quizBankPage.labels.copyTitle", { title: src.title, defaultValue: "{{title}} (copy)" }), uses: 0, lastUsed: t("quizBankPage.labels.never", { defaultValue: "Never" }) }, ...prev]);
    toast.success(t("quizBankPage.toast.duplicated", { defaultValue: "Quiz duplicated" }));
  };

  return (
    <DashboardShell>
      <TopBar title={t("quizBankPage.topbar.title", { defaultValue: "Quiz Bank" })} subtitle={t("quizBankPage.topbar.subtitle", { defaultValue: "Reusable quizzes you can launch live or assign as homework." })} showStreak={false} />
      <QuizListLayout
        q={q}
        onQChange={setQ}
        onNew={() => navigate({ to: "/ai-generator" })}
        count={filtered.length}
      >
        {filtered.map((quiz) => (
          <QuizRow
            key={quiz.id}
            title={quiz.title}
            course={quiz.course}
            questions={quiz.questions}
            uses={quiz.uses}
            lastUsed={quiz.lastUsed}
            isAi={quiz._gen}
            onDuplicate={quiz._gen ? undefined : () => duplicate(quiz.id)}
            onDelete={quiz._gen ? () => { remove(quiz.id); toast.success(t("quizBankPage.toast.removed", { defaultValue: "Removed" })); } : undefined}
            onLaunch={() => navigate({ to: "/live-quiz-host" })}
          />
        ))}
      </QuizListLayout>
    </DashboardShell>
  );
}

function BackendQuizBankPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const templatesQuery = useQuizTemplates();
  const deleteTemplate = useDeleteQuizTemplate();
  const duplicateTemplate = useDuplicateQuizTemplate();
  const recordUse = useRecordQuizTemplateUse();

  const templates = (templatesQuery.data ?? []).filter((template) =>
    template.title.toLowerCase().includes(q.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success(t("quizBankPage.toast.removed", { defaultValue: "Quiz removed." }));
    } catch {
      toast.error(t("quizBankPage.toast.removeFailed", { defaultValue: "Failed to remove quiz." }));
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateTemplate.mutateAsync(id);
      toast.success(t("quizBankPage.toast.duplicated", { defaultValue: "Quiz duplicated." }));
    } catch {
      toast.error(t("quizBankPage.toast.duplicateFailed", { defaultValue: "Failed to duplicate." }));
    }
  };

  const handleLaunch = async (id: number) => {
    recordUse.mutate(id);
    navigate({ to: "/live-quiz-host" });
  };

  return (
    <DashboardShell>
      <TopBar title={t("quizBankPage.topbar.title", { defaultValue: "Quiz Bank" })} subtitle={t("quizBankPage.topbar.subtitle", { defaultValue: "Reusable quizzes you can launch live or assign as homework." })} showStreak={false} />
      <QuizListLayout
        q={q}
        onQChange={setQ}
        onNew={() => navigate({ to: "/ai-generator" })}
        count={templates.length}
        loading={templatesQuery.isLoading}
      >
        {templates.map((template) => (
          <BackendQuizRow
            key={template.id}
            template={template}
            onDelete={() => handleDelete(template.id)}
            onDuplicate={() => handleDuplicate(template.id)}
            onLaunch={() => handleLaunch(template.id)}
            deleting={deleteTemplate.isPending && deleteTemplate.variables === template.id}
            duplicating={duplicateTemplate.isPending && duplicateTemplate.variables === template.id}
            locale={activeI18n.language}
          />
        ))}
        {!templatesQuery.isLoading && templates.length === 0 && (
          <li className="py-10 text-center">
            <p className="font-black text-base text-foreground/40">{t("quizBankPage.empty.title", { defaultValue: "No quizzes yet" })}</p>
            <p className="text-sm font-medium text-foreground/30 mt-1">
              {t("quizBankPage.empty.body", { defaultValue: "Generate one with the AI Generator and save it to the bank." })}
            </p>
          </li>
        )}
      </QuizListLayout>
    </DashboardShell>
  );
}

function BackendQuizRow({
  template,
  onDelete,
  onDuplicate,
  onLaunch,
  deleting,
  duplicating,
  locale,
}: {
  template: QuizTemplateRecord;
  onDelete: () => void;
  onDuplicate: () => void;
  onLaunch: () => void;
  deleting: boolean;
  duplicating: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const lastUsed = template.lastUsedAt
    ? relativeTime(template.lastUsedAt, locale, t)
    : t("quizBankPage.labels.never", { defaultValue: "Never" });

  return (
    <QuizRow
      title={template.title}
      course={template.courseName ?? "—"}
      questions={template.questionCount}
      uses={template.usesCount}
      lastUsed={lastUsed}
      isAi={false}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onLaunch={onLaunch}
      deleting={deleting}
      duplicating={duplicating}
    />
  );
}

function QuizListLayout({
  q,
  onQChange,
  onNew,
  count,
  loading = false,
  children,
}: {
  q: string;
  onQChange: (value: string) => void;
  onNew: () => void;
  count: number;
  loading?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 p-3 bg-card border-2 border-border rounded-2xl chunky-shadow flex-1 min-w-[240px] max-w-xl">
          <Search className="size-4 text-foreground/40" />
          <input value={q} onChange={(event) => onQChange(event.target.value)} placeholder={t("quizBankPage.search.placeholder", { defaultValue: "Search quizzes…" })}
            className="flex-1 bg-transparent outline-none text-sm font-medium" />
        </div>
        <button onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity">
          <Plus className="size-4" strokeWidth={3} /> {t("quizBankPage.actions.newQuiz", { defaultValue: "New quiz" })}
        </button>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-3 px-2">
          <Library className="size-5 text-primary" strokeWidth={2.5} />
          {loading ? <span className="opacity-40">{t("quizBankPage.state.loading", { defaultValue: "Loading…" })}</span> : t("quizBankPage.count.quizzes", { count, defaultValue: "{{count}} quizzes" })}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-foreground/40" aria-label={t("quizBankPage.state.loadingQuizzes", { defaultValue: "Loading quizzes…" })}>
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <ul className="divide-y divide-border">{children}</ul>
        )}
      </section>
    </>
  );
}

function QuizRow({
  title,
  course,
  questions,
  uses,
  lastUsed,
  isAi,
  onDelete,
  onDuplicate,
  onLaunch,
  deleting = false,
  duplicating = false,
}: {
  title: string;
  course: string;
  questions: number;
  uses: number;
  lastUsed: string;
  isAi: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onLaunch: () => void;
  deleting?: boolean;
  duplicating?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-2xl transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-black truncate flex items-center gap-2">
          {title}
          {isAi && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">AI</span>
          )}
        </p>
        <p className="text-xs text-foreground/50 font-medium mt-0.5">
          {t("quizBankPage.labels.quizMeta", {
            course,
            questions,
            uses,
            lastUsed,
            defaultValue: "{{course}} · {{questions}} questions · used {{uses}}× · last {{lastUsed}}",
          })}
        </p>
      </div>

      {onDelete && (
        <button onClick={onDelete} disabled={deleting} aria-label={t("quizBankPage.actions.delete", { defaultValue: "Delete quiz" })}
          className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      )}
      {onDuplicate && (
        <button onClick={onDuplicate} disabled={duplicating} aria-label={t("quizBankPage.actions.duplicate", { defaultValue: "Duplicate quiz" })}
          className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10 transition-colors disabled:opacity-50">
          {duplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
        </button>
      )}
      <button onClick={onLaunch}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs hover:opacity-90 transition-opacity">
        <PlayCircle className="size-4" strokeWidth={2.5} /> {t("quizBankPage.actions.launch", { defaultValue: "Launch" })}
      </button>
    </li>
  );
}

function relativeTime(iso: string, locale: string, t: ReturnType<typeof useTranslation>["t"]) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("quizBankPage.time.justNow", { defaultValue: "just now" });
  if (mins < 60) return t("quizBankPage.time.minutesAgo", { count: mins, defaultValue: "{{count}}m ago" });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("quizBankPage.time.hoursAgo", { count: hrs, defaultValue: "{{count}}h ago" });
  const days = Math.floor(hrs / 24);
  return t("quizBankPage.time.daysAgo", { count: days, defaultValue: "{{count}}d ago" });
}

function QuizBankPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendQuizBankPage /> : <PrototypeQuizBankPage />;
}
