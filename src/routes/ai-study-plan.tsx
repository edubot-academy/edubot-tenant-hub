import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Target, Clock, Calendar as CalIcon, Sparkles, Loader2, CheckCircle2, BookOpen,
  Download, Copy, Check, Save, Pencil, X, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import {
  useGenerateStudyPlan,
  useActiveStudyPlan,
  useSaveStudyPlan,
  useUpdateStudyPlanProgress,
  type SavedStudyPlanBlock,
  type StudyPlanBlock,
} from "@/lib/ai-tutor-api";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/ai-study-plan")({
  head: () => ({ meta: [{ title: i18n.t("studentPages.aiStudyPlan.metaTitle", { appName: i18n.t("app.name") }) }] }),
  component: AiStudyPlanPage,
});

type Task = { id: string; label: string; mins: number; done: boolean };
type Block = { day: string; focus: string; tasks: Task[] };

type Translate = (key: string, options?: Record<string, unknown>) => string;

function toBlocks(raw: StudyPlanBlock[] | SavedStudyPlanBlock[]): Block[] {
  return raw.map((b, i) => ({
    day: b.day,
    focus: b.focus,
    tasks: b.tasks.map((task, j) => ({
      id: (task as { id?: string }).id ?? `${i}-${j}`,
      label: task.label,
      mins: task.mins,
      done: (task as { done?: boolean }).done ?? false,
    })),
  }));
}

function blocksToSaved(blocks: Block[]): SavedStudyPlanBlock[] {
  return blocks.map((block) => ({ day: block.day, focus: block.focus, tasks: block.tasks.map((task) => ({ id: task.id, label: task.label, mins: task.mins, done: task.done })) }));
}

function planToText(t: Translate, goal: string, blocks: Block[]): string {
  const lines: string[] = [t("studentPages.aiStudyPlan.studyPlan", { goal }), ""];
  for (const block of blocks) {
    lines.push(`${block.day} — ${block.focus}`);
    for (const task of block.tasks) lines.push(`  ${task.done ? "✓" : "○"} ${task.label} (${t("studentPages.common.minutesShort", { count: task.mins })})`);
    lines.push("");
  }
  return lines.join("\n");
}

function newTaskId() {
  return `t-${Math.random().toString(36).slice(2, 9)}`;
}

function AiStudyPlanPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const isBackend = context.mode === "backend";

  const generateMutation = useGenerateStudyPlan();
  const saveMutation = useSaveStudyPlan();
  const progressMutation = useUpdateStudyPlanProgress();
  const { data: activePlan, isLoading: planLoading } = useActiveStudyPlan();

  const [goal, setGoal] = useState(() => t("studentPages.aiStudyPlan.defaultGoal"));
  const [weeks, setWeeks] = useState(2);
  const [minsPerDay, setMinsPerDay] = useState(45);
  const [strengths, setStrengths] = useState(() => t("studentPages.aiStudyPlan.defaultStrengths"));
  const [weaknesses, setWeaknesses] = useState(() => t("studentPages.aiStudyPlan.defaultWeaknesses"));
  const [plan, setPlan] = useState<Block[] | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!activePlan || plan) return;
    setGoal(activePlan.goal);
    setWeeks(activePlan.weeks);
    setMinsPerDay(activePlan.minsPerDay);
    if (activePlan.strengths) setStrengths(activePlan.strengths);
    if (activePlan.weaknesses) setWeaknesses(activePlan.weaknesses);
    setPlan(toBlocks(activePlan.blocks));
    setSavedPlanId(activePlan.id);
  }, [activePlan, plan]);

  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveProgress = useCallback((id: number, blocks: Block[]) => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      progressMutation.mutate({ id, blocks: blocksToSaved(blocks) });
    }, 800);
  }, [progressMutation]);

  const updatePlan = useCallback((next: Block[]) => {
    setPlan(next);
    if (savedPlanId) saveProgress(savedPlanId, next);
  }, [savedPlanId, saveProgress]);

  const loading = generateMutation.isPending || (isBackend && planLoading && !plan);

  const generate = async () => {
    setPlan(null);
    setSavedPlanId(null);
    setEditMode(false);
    if (isBackend) {
      try {
        const result = await generateMutation.mutateAsync({ goal, weeks, minsPerDay, strengths, weaknesses });
        const blocks = toBlocks(result.blocks);
        setPlan(blocks);
        const saved = await saveMutation.mutateAsync({ goal, weeks, minsPerDay, days: result.days, strengths, weaknesses, blocks: blocksToSaved(blocks) });
        setSavedPlanId(saved.id);
        toast.success(t("studentPages.aiStudyPlan.planSaved"));
      } catch {
        toast.error(t("studentPages.aiStudyPlan.generateFailed"));
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setPlan(makePlan(t, weeks, minsPerDay, weaknesses));
    }
  };

  const toggle = (dayIndex: number, taskId: string) => {
    if (editMode) return;
    updatePlan(
      (plan ?? []).map((block, index) =>
        index === dayIndex ? { ...block, tasks: block.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)) } : block,
      ),
    );
  };

  const setFocus = (dayIndex: number, value: string) =>
    updatePlan((plan ?? []).map((block, index) => (index === dayIndex ? { ...block, focus: value } : block)));

  const setTaskLabel = (dayIndex: number, taskId: string, value: string) =>
    updatePlan((plan ?? []).map((block, index) =>
      index === dayIndex ? { ...block, tasks: block.tasks.map((task) => (task.id === taskId ? { ...task, label: value } : task)) } : block,
    ));

  const setTaskMins = (dayIndex: number, taskId: string, value: number) =>
    updatePlan((plan ?? []).map((block, index) =>
      index === dayIndex ? { ...block, tasks: block.tasks.map((task) => (task.id === taskId ? { ...task, mins: Math.max(1, value) } : task)) } : block,
    ));

  const removeTask = (dayIndex: number, taskId: string) =>
    updatePlan((plan ?? []).map((block, index) =>
      index === dayIndex ? { ...block, tasks: block.tasks.filter((task) => task.id !== taskId) } : block,
    ));

  const addTask = (dayIndex: number) =>
    updatePlan((plan ?? []).map((block, index) =>
      index === dayIndex ? { ...block, tasks: [...block.tasks, { id: newTaskId(), label: t("studentPages.aiStudyPlan.newTask"), mins: 15, done: false }] } : block,
    ));

  const handleCopy = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(planToText(t, goal, plan));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("studentPages.aiStudyPlan.copied"));
  };

  const total = plan?.reduce((sum, block) => sum + block.tasks.length, 0) ?? 0;
  const done = plan?.reduce((sum, block) => sum + block.tasks.filter((task) => task.done).length, 0) ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <DashboardShell>
      <TopBar title={t("studentPages.aiStudyPlan.title")} subtitle={t("studentPages.aiStudyPlan.subtitle")} showStreak={false} />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #study-plan-print, #study-plan-print * { visibility: visible; }
          #study-plan-print { position: absolute; inset: 0; padding: 24px; }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4 h-fit print:hidden">
          <Field label={t("studentPages.aiStudyPlan.goal")} icon={Target}>
            <input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("studentPages.aiStudyPlan.duration")} icon={CalIcon}>
              <select value={weeks} onChange={(event) => setWeeks(+event.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[1, 2, 3, 4, 6, 8].map((week) => <option key={week} value={week}>{t("studentPages.aiStudyPlan.weeks", { count: week })}</option>)}
              </select>
            </Field>
            <Field label={t("studentPages.aiStudyPlan.timePerDay")} icon={Clock}>
              <select value={minsPerDay} onChange={(event) => setMinsPerDay(+event.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[15, 30, 45, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{t("studentPages.aiStudyPlan.min", { count: minutes })}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t("studentPages.aiStudyPlan.strengths")}>
            <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>
          <Field label={t("studentPages.aiStudyPlan.weaknesses")}>
            <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>

          <button onClick={generate} disabled={loading || !goal.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> {t("studentPages.aiStudyPlan.building")}</> : <><Sparkles className="size-4" strokeWidth={2.5} /> {t("studentPages.aiStudyPlan.generate")}</>}
          </button>

          {plan && (
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold hover:bg-muted/70 transition-colors">
                {copied ? <Check className="size-3.5 text-green-500" strokeWidth={3} /> : <Copy className="size-3.5" strokeWidth={2.5} />}
                {copied ? t("studentPages.aiStudyPlan.copiedButton") : t("studentPages.aiStudyPlan.copy")}
              </button>
              <button onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold hover:bg-muted/70 transition-colors">
                <Download className="size-3.5" strokeWidth={2.5} /> {t("studentPages.aiStudyPlan.exportPdf")}
              </button>
            </div>
          )}

          {savedPlanId && (
            <p className="text-[10px] font-bold text-foreground/40 flex items-center gap-1 justify-center">
              <Save className="size-3" /> {t("studentPages.aiStudyPlan.autoSaved")}{progressMutation.isPending && ` · ${t("studentPages.aiStudyPlan.saving")}`}
            </p>
          )}
        </aside>

        <section className="space-y-4" id="study-plan-print">
          {!plan && !loading && (
            <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow grid place-items-center text-center min-h-[420px]">
              <div className="max-w-sm space-y-2">
                <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                  <Target className="size-7" strokeWidth={2.5} />
                </div>
                <p className="font-black text-lg">{t("studentPages.aiStudyPlan.emptyTitle")}</p>
                <p className="text-sm font-medium text-foreground/55">{t("studentPages.aiStudyPlan.emptyBody")}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-3">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          )}

          {plan && !loading && (
            <>
              <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-lg">{goal}</p>
                    <p className="text-xs font-bold text-foreground/55">{t("studentPages.aiStudyPlan.summary", { weeks, mins: minsPerDay, tasks: total })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary">{pct}%</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">{t("studentPages.aiStudyPlan.complete")}</p>
                    </div>
                    <button
                      onClick={() => setEditMode((value) => !value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-colors print:hidden ${
                        editMode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-muted/70"
                      }`}
                    >
                      <Pencil className="size-3.5" strokeWidth={2.5} />
                      {editMode ? t("studentPages.aiStudyPlan.done") : t("studentPages.aiStudyPlan.edit")}
                    </button>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-foreground">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {plan.map((block, dayIndex) => (
                <article key={dayIndex} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{block.day}</p>
                      {editMode ? (
                        <input
                          value={block.focus}
                          onChange={(event) => setFocus(dayIndex, event.target.value)}
                          className="font-black text-base w-full bg-muted border-2 border-border rounded-xl px-2 py-1 mt-1 focus:outline-none focus:border-primary/50"
                        />
                      ) : (
                        <p className="font-black text-base flex items-center gap-2">
                          <BookOpen className="size-4 text-primary shrink-0" strokeWidth={2.5} /> {block.focus}
                        </p>
                      )}
                    </div>
                    {!editMode && (
                      <span className="ml-3 shrink-0 px-2.5 py-1 rounded-xl bg-muted text-[11px] font-black">
                        {t("studentPages.aiStudyPlan.min", { count: block.tasks.reduce((sum, task) => sum + task.mins, 0) })}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {block.tasks.map((task) =>
                      editMode ? (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded-xl border-2 border-dashed border-border bg-muted/40">
                          <input
                            value={task.label}
                            onChange={(event) => setTaskLabel(dayIndex, task.id, event.target.value)}
                            className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
                          />
                          <input
                            type="number"
                            value={task.mins}
                            min={1}
                            onChange={(event) => setTaskMins(dayIndex, task.id, +event.target.value)}
                            className="w-14 text-right bg-background border-2 border-border rounded-lg px-1.5 py-0.5 text-xs font-black focus:outline-none focus:border-primary/50"
                          />
                          <span className="text-xs font-bold text-foreground/50">m</span>
                          <button onClick={() => removeTask(dayIndex, task.id)}
                            className="shrink-0 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <X className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button key={task.id} onClick={() => toggle(dayIndex, task.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                            task.done ? "bg-primary/10 border-primary/30 line-through opacity-70" : "bg-background border-border hover:bg-muted/50"
                          }`}>
                          <CheckCircle2 className={`size-5 shrink-0 ${task.done ? "text-primary fill-primary/20" : "text-foreground/30"}`} strokeWidth={2.5} />
                          <span className="flex-1 text-sm font-bold">{task.label}</span>
                          <span className="text-[11px] font-black font-mono text-foreground/55">{t("studentPages.common.minutesShort", { count: task.mins })}</span>
                        </button>
                      ),
                    )}

                    {editMode && (
                      <button onClick={() => addTask(dayIndex)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-border text-sm font-bold text-foreground/50 hover:border-primary/40 hover:text-primary transition-colors mt-1">
                        <Plus className="size-3.5" strokeWidth={2.5} /> {t("studentPages.aiStudyPlan.addTask")}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Target; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="size-3" strokeWidth={3} />} {label}
      </p>
      {children}
    </div>
  );
}

function makePlan(t: Translate, weeks: number, mins: number, weak: string): Block[] {
  const days = Math.min(weeks * 5, 10);
  const focusPool = [
    t("studentPages.aiStudyPlan.prototypeFocus.foundations"),
    t("studentPages.aiStudyPlan.prototypeFocus.weakSpot", { topic: weak.split(",")[0]?.trim() || t("studentPages.aiStudyPlan.prototypeFocus.core") }),
    t("studentPages.aiStudyPlan.prototypeFocus.quiz"),
    t("studentPages.aiStudyPlan.prototypeFocus.recall"),
    t("studentPages.aiStudyPlan.prototypeFocus.mixed"),
    t("studentPages.aiStudyPlan.prototypeFocus.exam"),
    t("studentPages.aiStudyPlan.prototypeFocus.errors"),
  ];
  return Array.from({ length: days }).map((_, index) => {
    const focus = focusPool[index % focusPool.length];
    const taskMins = [Math.round(mins * 0.4), Math.round(mins * 0.4), Math.round(mins * 0.2)];
    return {
      day: t("studentPages.aiStudyPlan.day", { day: index + 1, weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7] }),
      focus,
      tasks: [
        { id: `${index}-a`, label: t("studentPages.aiStudyPlan.prototypeTasks.read", { focus }), mins: taskMins[0], done: false },
        { id: `${index}-b`, label: t("studentPages.aiStudyPlan.prototypeTasks.flashcards"), mins: taskMins[1], done: false },
        { id: `${index}-c`, label: t("studentPages.aiStudyPlan.prototypeTasks.reflect"), mins: taskMins[2], done: false },
      ],
    };
  });
}
