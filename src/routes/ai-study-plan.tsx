import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Target, Clock, Calendar as CalIcon, Sparkles, Loader2, CheckCircle2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/ai-study-plan")({
  head: () => ({ meta: [{ title: "QuestLMS — AI Study Plan" }] }),
  component: AiStudyPlanPage,
});

type Block = { day: string; focus: string; tasks: { id: string; label: string; mins: number; done?: boolean }[] };

function AiStudyPlanPage() {
  const [goal, setGoal] = useState("Ace my cognitive psychology midterm");
  const [weeks, setWeeks] = useState(2);
  const [minsPerDay, setMinsPerDay] = useState(45);
  const [strengths, setStrengths] = useState("Reading, summarising");
  const [weaknesses, setWeaknesses] = useState("Recalling definitions, multi-step problems");
  const [plan, setPlan] = useState<Block[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    setPlan(null);
    setTimeout(() => {
      setPlan(makePlan(weeks, minsPerDay, weaknesses));
      setLoading(false);
    }, 900);
  };

  const toggle = (di: number, ti: string) => {
    setPlan(prev => prev?.map((b, i) => i === di
      ? { ...b, tasks: b.tasks.map(t => t.id === ti ? { ...t, done: !t.done } : t) }
      : b) ?? null);
  };

  const total = plan?.reduce((s, b) => s + b.tasks.length, 0) ?? 0;
  const done = plan?.reduce((s, b) => s + b.tasks.filter(t => t.done).length, 0) ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <DashboardShell>
      <TopBar title="AI Study Plan" subtitle="A personalized roadmap tuned to your goal, time, and weak spots." showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4 h-fit">
          <Field label="Goal" icon={Target}>
            <input value={goal} onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-medium focus:outline-none focus:border-primary/50" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration" icon={CalIcon}>
              <select value={weeks} onChange={(e) => setWeeks(+e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[1,2,3,4,6,8].map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </Field>
            <Field label="Time / day" icon={Clock}>
              <select value={minsPerDay} onChange={(e) => setMinsPerDay(+e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border-2 border-border text-sm font-bold focus:outline-none focus:border-primary/50">
                {[15,30,45,60,90].map(m => <option key={m} value={m}>{m} min</option>)}
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

          <button onClick={generate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground border-2 border-foreground chunky-shadow font-black disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Building…</> : <><Sparkles className="size-4" strokeWidth={2.5} /> Generate plan</>}
          </button>
        </aside>

        <section className="space-y-4">
          {!plan && !loading && (
            <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow grid place-items-center text-center min-h-[420px]">
              <div className="max-w-sm space-y-2">
                <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow border-2 border-foreground">
                  <Target className="size-7" strokeWidth={2.5} />
                </div>
                <p className="font-black text-lg">Your plan will appear here</p>
                <p className="text-sm font-medium text-foreground/55">Fill in your goal and constraints, then hit Generate. The AI will balance review, practice, and rest days.</p>
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
              <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-lg">{goal}</p>
                    <p className="text-xs font-bold text-foreground/55">{weeks} weeks · {minsPerDay} min/day · {total} tasks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary">{pct}%</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">complete</p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-foreground">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {plan.map((b, di) => (
                <article key={di} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{b.day}</p>
                      <p className="font-black text-base flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" strokeWidth={2.5} /> {b.focus}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-muted text-[11px] font-black">
                      {b.tasks.reduce((s, t) => s + t.mins, 0)} min
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {b.tasks.map(t => (
                      <li key={t.id}>
                        <button onClick={() => toggle(di, t.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                            t.done ? "bg-primary/10 border-primary/30 line-through opacity-70" : "bg-background border-border hover:bg-muted/50"
                          }`}>
                          <CheckCircle2 className={`size-5 shrink-0 ${t.done ? "text-primary fill-primary/20" : "text-foreground/30"}`} strokeWidth={2.5} />
                          <span className="flex-1 text-sm font-bold">{t.label}</span>
                          <span className="text-[11px] font-black font-mono text-foreground/55">{t.mins}m</span>
                        </button>
                      </li>
                    ))}
                  </ul>
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
  const days = Math.min(weeks * 5, 14); // cap visible
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
      day: `Day ${i + 1} · ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i % 7]}`,
      focus,
      tasks: [
        { id: `${i}-a`, label: `Read & summarise: ${focus}`, mins: taskMins[0] },
        { id: `${i}-b`, label: "Active recall — flashcards (15 cards)", mins: taskMins[1] },
        { id: `${i}-c`, label: "Reflect: 3 things I learned, 1 I'm unsure of", mins: taskMins[2] },
      ],
    };
  });
}
