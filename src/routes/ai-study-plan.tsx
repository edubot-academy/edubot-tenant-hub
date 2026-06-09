import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

export const Route = createFileRoute("/ai-study-plan")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Study Plan" }] }),
  component: AiStudyPlanPage,
});

type Task = { id: string; label: string; mins: number; done: boolean };
type Block = { day: string; focus: string; tasks: Task[] };

function toBlocks(raw: StudyPlanBlock[] | SavedStudyPlanBlock[]): Block[] {
  return raw.map((b, i) => ({
    day: b.day,
    focus: b.focus,
    tasks: b.tasks.map((t, j) => ({
      id: (t as { id?: string }).id ?? `${i}-${j}`,
      label: t.label,
      mins: t.mins,
      done: (t as { done?: boolean }).done ?? false,
    })),
  }));
}

function blocksToSaved(blocks: Block[]): SavedStudyPlanBlock[] {
  return blocks.map((b) => ({ day: b.day, focus: b.focus, tasks: b.tasks.map((t) => ({ id: t.id, label: t.label, mins: t.mins, done: t.done })) }));
}

function planToText(goal: string, blocks: Block[]): string {
  const lines: string[] = [`Study Plan: ${goal}`, ""];
  for (const b of blocks) {
    lines.push(`${b.day} — ${b.focus}`);
    for (const t of b.tasks) lines.push(`  ${t.done ? "✓" : "○"} ${t.label} (${t.mins}m)`);
    lines.push("");
  }
  return lines.join("\n");
}

function newTaskId() {
  return `t-${Math.random().toString(36).slice(2, 9)}`;
}

function AiStudyPlanPage() {
  const { context } = useAppContext();
  const isBackend = context.mode === "backend";

  const generateMutation = useGenerateStudyPlan();
  const saveMutation = useSaveStudyPlan();
  const progressMutation = useUpdateStudyPlanProgress();
  const { data: activePlan, isLoading: planLoading } = useActiveStudyPlan();

  const [goal, setGoal] = useState("Ace my cognitive psychology midterm");
  const [weeks, setWeeks] = useState(2);
  const [minsPerDay, setMinsPerDay] = useState(45);
  const [strengths, setStrengths] = useState("Reading, summarising");
  const [weaknesses, setWeaknesses] = useState("Recalling definitions, multi-step problems");
  const [plan, setPlan] = useState<Block[] | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Restore active plan on load; skip if user has already generated a plan this session
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

  // Debounced progress save
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
        toast.success("Plan saved!");
      } catch {
        toast.error("Failed to generate plan. Please try again.");
      }
    } else {
      await new Promise((r) => setTimeout(r, 900));
      setPlan(makePlan(weeks, minsPerDay, weaknesses));
    }
  };

  // ── task completion toggle (non-edit mode) ───────────────────────────────
  const toggle = (di: number, tid: string) => {
    if (editMode) return;
    updatePlan(
      (plan ?? []).map((b, i) =>
        i === di ? { ...b, tasks: b.tasks.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : b,
      ),
    );
  };

  // ── edit-mode mutations ──────────────────────────────────────────────────
  const setFocus = (di: number, value: string) =>
    updatePlan((plan ?? []).map((b, i) => (i === di ? { ...b, focus: value } : b)));

  const setTaskLabel = (di: number, tid: string, value: string) =>
    updatePlan((plan ?? []).map((b, i) =>
      i === di ? { ...b, tasks: b.tasks.map((t) => (t.id === tid ? { ...t, label: value } : t)) } : b,
    ));

  const setTaskMins = (di: number, tid: string, value: number) =>
    updatePlan((plan ?? []).map((b, i) =>
      i === di ? { ...b, tasks: b.tasks.map((t) => (t.id === tid ? { ...t, mins: Math.max(1, value) } : t)) } : b,
    ));

  const removeTask = (di: number, tid: string) =>
    updatePlan((plan ?? []).map((b, i) =>
      i === di ? { ...b, tasks: b.tasks.filter((t) => t.id !== tid) } : b,
    ));

  const addTask = (di: number) =>
    updatePlan((plan ?? []).map((b, i) =>
      i === di ? { ...b, tasks: [...b.tasks, { id: newTaskId(), label: "New task", mins: 15, done: false }] } : b,
    ));

  // ── export ───────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(planToText(goal, plan));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const total = plan?.reduce((s, b) => s + b.tasks.length, 0) ?? 0;
  const done = plan?.reduce((s, b) => s + b.tasks.filter((t) => t.done).length, 0) ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <DashboardShell>
      <TopBar title="AI Study Plan" subtitle="A personalized roadmap tuned to your goal, time, and weak spots." showStreak={false} />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #study-plan-print, #study-plan-print * { visibility: visible; }
          #study-plan-print { position: absolute; inset: 0; padding: 24px; }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* ── sidebar ── */}
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4 h-fit print:hidden">
          <Field label="Goal" icon={Target}>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration" icon={CalIcon}>
              <select value={weeks} onChange={(e) => setWeeks(+e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[1, 2, 3, 4, 6, 8].map((w) => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </Field>
            <Field label="Time / day" icon={Clock}>
              <select value={minsPerDay} onChange={(e) => setMinsPerDay(+e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </Field>
          </div>

          <Field label="My strengths">
            <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>
          <Field label="What I struggle with">
            <textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>

          <button onClick={generate} disabled={loading || !goal.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Building…</> : <><Sparkles className="size-4" strokeWidth={2.5} /> Generate plan</>}
          </button>

          {plan && (
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold hover:bg-muted/70 transition-colors">
                {copied ? <Check className="size-3.5 text-green-500" strokeWidth={3} /> : <Copy className="size-3.5" strokeWidth={2.5} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-border bg-muted text-sm font-bold hover:bg-muted/70 transition-colors">
                <Download className="size-3.5" strokeWidth={2.5} /> Export PDF
              </button>
            </div>
          )}

          {savedPlanId && (
            <p className="text-[10px] font-bold text-foreground/40 flex items-center gap-1 justify-center">
              <Save className="size-3" /> Auto-saved{progressMutation.isPending && " · saving…"}
            </p>
          )}
        </aside>

        {/* ── plan ── */}
        <section className="space-y-4" id="study-plan-print">
          {!plan && !loading && (
            <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow grid place-items-center text-center min-h-[420px]">
              <div className="max-w-sm space-y-2">
                <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                  <Target className="size-7" strokeWidth={2.5} />
                </div>
                <p className="font-black text-lg">Your plan will appear here</p>
                <p className="text-sm font-medium text-foreground/55">Fill in your goal and constraints, then hit Generate.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          )}

          {plan && !loading && (
            <>
              {/* progress header */}
              <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-lg">{goal}</p>
                    <p className="text-xs font-bold text-foreground/55">{weeks} weeks · {minsPerDay} min/day · {total} tasks</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary">{pct}%</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">complete</p>
                    </div>
                    <button
                      onClick={() => setEditMode((v) => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-colors print:hidden ${
                        editMode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-muted/70"
                      }`}
                    >
                      <Pencil className="size-3.5" strokeWidth={2.5} />
                      {editMode ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-foreground">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* day cards */}
              {plan.map((b, di) => (
                <article key={di} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{b.day}</p>
                      {editMode ? (
                        <input
                          value={b.focus}
                          onChange={(e) => setFocus(di, e.target.value)}
                          className="font-black text-base w-full bg-muted border-2 border-border rounded-xl px-2 py-1 mt-1 focus:outline-none focus:border-primary/50"
                        />
                      ) : (
                        <p className="font-black text-base flex items-center gap-2">
                          <BookOpen className="size-4 text-primary shrink-0" strokeWidth={2.5} /> {b.focus}
                        </p>
                      )}
                    </div>
                    {!editMode && (
                      <span className="ml-3 shrink-0 px-2.5 py-1 rounded-xl bg-muted text-[11px] font-black">
                        {b.tasks.reduce((s, t) => s + t.mins, 0)} min
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {b.tasks.map((t) =>
                      editMode ? (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl border-2 border-dashed border-border bg-muted/40">
                          <input
                            value={t.label}
                            onChange={(e) => setTaskLabel(di, t.id, e.target.value)}
                            className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
                          />
                          <input
                            type="number"
                            value={t.mins}
                            min={1}
                            onChange={(e) => setTaskMins(di, t.id, +e.target.value)}
                            className="w-14 text-right bg-background border-2 border-border rounded-lg px-1.5 py-0.5 text-xs font-black focus:outline-none focus:border-primary/50"
                          />
                          <span className="text-xs font-bold text-foreground/50">m</span>
                          <button onClick={() => removeTask(di, t.id)}
                            className="shrink-0 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <X className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button key={t.id} onClick={() => toggle(di, t.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                            t.done ? "bg-primary/10 border-primary/30 line-through opacity-70" : "bg-background border-border hover:bg-muted/50"
                          }`}>
                          <CheckCircle2 className={`size-5 shrink-0 ${t.done ? "text-primary fill-primary/20" : "text-foreground/30"}`} strokeWidth={2.5} />
                          <span className="flex-1 text-sm font-bold">{t.label}</span>
                          <span className="text-[11px] font-black font-mono text-foreground/55">{t.mins}m</span>
                        </button>
                      ),
                    )}

                    {editMode && (
                      <button onClick={() => addTask(di)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-border text-sm font-bold text-foreground/50 hover:border-primary/40 hover:text-primary transition-colors mt-1">
                        <Plus className="size-3.5" strokeWidth={2.5} /> Add task
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

function makePlan(weeks: number, mins: number, weak: string): Block[] {
  const days = Math.min(weeks * 5, 10);
  const focusPool = [
    "Foundations review",
    `Weak-spot drill: ${weak.split(",")[0]?.trim() || "core concepts"}`,
    "Practice quiz",
    "Active recall & flashcards",
    "Mixed problem set",
    "Mock exam (timed)",
    "Error log review",
  ];
  return Array.from({ length: days }).map((_, i) => {
    const focus = focusPool[i % focusPool.length];
    const taskMins = [Math.round(mins * 0.4), Math.round(mins * 0.4), Math.round(mins * 0.2)];
    return {
      day: `Day ${i + 1} · ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]}`,
      focus,
      tasks: [
        { id: `${i}-a`, label: `Read & summarise: ${focus}`, mins: taskMins[0], done: false },
        { id: `${i}-b`, label: "Active recall — flashcards (15 cards)", mins: taskMins[1], done: false },
        { id: `${i}-c`, label: "Reflect: 3 things I learned, 1 I'm unsure of", mins: taskMins[2], done: false },
      ],
    };
  });
}
