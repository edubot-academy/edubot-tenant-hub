import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Library, Search, PlayCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import { useGeneratedQuizzes } from "@/lib/quizStore";
import {
  useQuizTemplates,
  useDeleteQuizTemplate,
  useDuplicateQuizTemplate,
  useRecordQuizTemplateUse,
  type QuizTemplateRecord,
} from "@/lib/quiz-bank-api";

export const Route = createFileRoute("/quiz-bank")({
  head: () => ({ meta: [{ title: "QuestLMS — Quiz Bank" }] }),
  component: QuizBankPage,
});

// ─── Prototype page ───────────────────────────────────────────────────────────

const PROTO_QUIZZES = [
  { id: "q1", title: "Working memory — chapter quiz", course: "Cognitive Psychology", questions: 18, lastUsed: "2d ago", uses: 12 },
  { id: "q2", title: "Attention models pop quiz",      course: "Cognitive Psychology", questions: 8,  lastUsed: "1w ago", uses: 5 },
  { id: "q3", title: "Nucleophilic substitution",      course: "Organic Chemistry II", questions: 22, lastUsed: "3d ago", uses: 9 },
  { id: "q4", title: "Stereochemistry basics",         course: "Organic Chemistry II", questions: 15, lastUsed: "2w ago", uses: 7 },
  { id: "q5", title: "Lab safety refresher",           course: "Organic Chemistry II", questions: 10, lastUsed: "Yesterday", uses: 3 },
  { id: "q6", title: "Modern era — vocabulary",        course: "World History",        questions: 30, lastUsed: "Never",    uses: 0 },
];

function PrototypeQuizBankPage() {
  const navigate = useNavigate();
  const { list: generated, remove } = useGeneratedQuizzes();
  const [q, setQ] = useState("");
  const [list, setList] = useState(PROTO_QUIZZES);

  const all = [
    ...generated.map((g) => ({ ...g, _gen: true as const })),
    ...list.map((l) => ({ ...l, _gen: false as const })),
  ];
  const filtered = all.filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));

  const duplicate = (id: string) => {
    const src = list.find((x) => x.id === id);
    if (!src) return;
    setList((prev) => [{ ...src, id: `${id}-copy-${Date.now()}`, title: `${src.title} (copy)`, uses: 0, lastUsed: "Never" }, ...prev]);
    toast.success("Quiz duplicated");
  };

  return (
    <DashboardShell>
      <TopBar title="Quiz Bank" subtitle="Reusable quizzes you can launch live or assign as homework." showStreak={false} />
      <QuizListLayout
        q={q}
        onQChange={setQ}
        onNew={() => navigate({ to: "/ai-generator" })}
        count={filtered.length}
      >
        {filtered.map((qz) => (
          <QuizRow
            key={qz.id}
            title={qz.title}
            course={qz.course}
            questions={qz.questions}
            uses={qz.uses}
            lastUsed={qz.lastUsed}
            isAi={qz._gen}
            onDuplicate={qz._gen ? undefined : () => duplicate(qz.id)}
            onDelete={qz._gen ? () => { remove(qz.id); toast.success("Removed"); } : undefined}
            onLaunch={() => navigate({ to: "/live-quiz-host" })}
          />
        ))}
      </QuizListLayout>
    </DashboardShell>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendQuizBankPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const templatesQuery = useQuizTemplates();
  const deleteTemplate = useDeleteQuizTemplate();
  const duplicateTemplate = useDuplicateQuizTemplate();
  const recordUse = useRecordQuizTemplateUse();

  const templates = (templatesQuery.data ?? []).filter((t) =>
    t.title.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Quiz removed.");
    } catch {
      toast.error("Failed to remove quiz.");
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateTemplate.mutateAsync(id);
      toast.success("Quiz duplicated.");
    } catch {
      toast.error("Failed to duplicate.");
    }
  };

  const handleLaunch = async (id: number) => {
    recordUse.mutate(id);
    navigate({ to: "/live-quiz-host" });
  };

  return (
    <DashboardShell>
      <TopBar title="Quiz Bank" subtitle="Reusable quizzes you can launch live or assign as homework." showStreak={false} />
      <QuizListLayout
        q={q}
        onQChange={setQ}
        onNew={() => navigate({ to: "/ai-generator" })}
        count={templates.length}
        loading={templatesQuery.isLoading}
      >
        {templates.map((t) => (
          <BackendQuizRow
            key={t.id}
            template={t}
            onDelete={() => handleDelete(t.id)}
            onDuplicate={() => handleDuplicate(t.id)}
            onLaunch={() => handleLaunch(t.id)}
            deleting={deleteTemplate.isPending && deleteTemplate.variables === t.id}
            duplicating={duplicateTemplate.isPending && duplicateTemplate.variables === t.id}
          />
        ))}
        {!templatesQuery.isLoading && templates.length === 0 && (
          <li className="py-10 text-center">
            <p className="font-black text-base text-foreground/40">No quizzes yet</p>
            <p className="text-sm font-medium text-foreground/30 mt-1">
              Generate one with the AI Generator and save it to the bank.
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
}: {
  template: QuizTemplateRecord;
  onDelete: () => void;
  onDuplicate: () => void;
  onLaunch: () => void;
  deleting: boolean;
  duplicating: boolean;
}) {
  const lastUsed = template.lastUsedAt
    ? relativeTime(template.lastUsedAt)
    : "Never";

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

// ─── Shared components ────────────────────────────────────────────────────────

function QuizListLayout({
  q,
  onQChange,
  onNew,
  count,
  loading = false,
  children,
}: {
  q: string;
  onQChange: (v: string) => void;
  onNew: () => void;
  count: number;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 p-3 bg-card border-2 border-border rounded-2xl chunky-shadow flex-1 min-w-[240px] max-w-xl">
          <Search className="size-4 text-foreground/40" />
          <input value={q} onChange={(e) => onQChange(e.target.value)} placeholder="Search quizzes…"
            className="flex-1 bg-transparent outline-none text-sm font-medium" />
        </div>
        <button onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow hover:opacity-90 transition-opacity">
          <Plus className="size-4" strokeWidth={3} /> New quiz
        </button>
      </div>

      <section className="bg-card border-2 border-border rounded-3xl p-3 sm:p-5 chunky-shadow">
        <h3 className="font-black text-xl flex items-center gap-2 mb-3 px-2">
          <Library className="size-5 text-primary" strokeWidth={2.5} />
          {loading ? <span className="opacity-40">Loading…</span> : `${count} quizzes`}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-foreground/40">
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
          {course} · {questions} questions · used {uses}× · last {lastUsed}
        </p>
      </div>

      {onDelete && (
        <button onClick={onDelete} disabled={deleting}
          className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      )}
      {onDuplicate && (
        <button onClick={onDuplicate} disabled={duplicating}
          className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10 transition-colors disabled:opacity-50">
          {duplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
        </button>
      )}
      <button onClick={onLaunch}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs hover:opacity-90 transition-opacity">
        <PlayCircle className="size-4" strokeWidth={2.5} /> Launch
      </button>
    </li>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function QuizBankPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendQuizBankPage /> : <PrototypeQuizBankPage />;
}
